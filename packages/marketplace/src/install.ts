import { getRegistryClient } from "./registry-client.js";
import { getManifestManager } from "./manifest-manager.js";
import { checkPackageIntegrity } from "./integrity.js";
import { execSync } from "child_process";
import * as path from "path";
import * as fs from "fs/promises";
import * as os from "os";

/**
 * Install a plugin from the marketplace
 */
export async function installPlugin(
  pluginId: string,
  version?: string,
): Promise<void> {
  const registry = getRegistryClient();
  const manifest = getManifestManager();

  try {
    // Step 1: Get plugin metadata from registry
    const pluginEntry = await registry.getPlugin(pluginId);
    if (!pluginEntry) {
      throw new Error(`Plugin "${pluginId}" not found in registry`);
    }

    // Check if already installed
    const existing = await manifest.getPlugin(pluginId);
    if (existing) {
      console.log(
        `⚠️  Plugin "${pluginId}" is already installed (v${existing.version})`,
      );
      console.log(`   Use 'sancus plugin update ${pluginId}' to upgrade`);
      return;
    }

    console.log(`📥 Installing ${pluginEntry.name}...`);

    // Step 2: Determine package to install
    const npmPackage = pluginEntry.npmPackage.name;
    const targetVersion = version || pluginEntry.version;
    const packageSpec = `${npmPackage}@${targetVersion}`;

    // Step 3: Install via npm to global plugins directory
    const pluginDir = path.join(os.homedir(), ".sancus", "plugins");
    await fs.mkdir(pluginDir, { recursive: true });

    console.log(`   Installing from npm: ${packageSpec}`);
    try {
      // Use npm to install to local directory
      execSync(`npm install ${packageSpec} --prefix "${pluginDir}" --save`, {
        stdio: "inherit",
        cwd: pluginDir,
      });
    } catch (error) {
      throw new Error(`Failed to install npm package: ${error}`);
    }

    // Step 4: Verify the plugin was installed
    const packageJsonPath = path.join(
      pluginDir,
      "node_modules",
      npmPackage,
      "package.json",
    );
    if (!(await fileExists(packageJsonPath))) {
      throw new Error(`Plugin package not found after installation`);
    }

    // Step 5: Verify package integrity (no-op when registry entry has no integrity fields)
    const integrityResult = await checkPackageIntegrity(pluginEntry, pluginDir);
    if (!integrityResult.passed) {
      throw new Error(
        `Package integrity check failed (method: ${integrityResult.method}):\n${integrityResult.error}`,
      );
    }
    if (integrityResult.checked) {
      console.log(`   ✓ Integrity verified (${integrityResult.method})`);
    }

    // Step 6: Register in manifest
    await manifest.install(pluginId, targetVersion, "npm", npmPackage);

    console.log(`✅ Plugin installed successfully`);
    console.log(`   Run 'sancus scan' to auto-load the plugin`);
  } catch (error: any) {
    console.error(`❌ Installation failed: ${error.message}`);
    throw error;
  }
}

/**
 * Uninstall a plugin
 */
export async function uninstallPlugin(
  pluginId: string,
  force: boolean = false,
): Promise<void> {
  const manifest = getManifestManager();

  try {
    // Check if installed
    const plugin = await manifest.getPlugin(pluginId);
    if (!plugin) {
      console.log(`⚠️  Plugin "${pluginId}" is not installed`);
      return;
    }

    if (!force) {
      console.log(`Are you sure you want to uninstall "${pluginId}"?`);
      console.log(`Run with --force to skip confirmation`);
      return;
    }

    console.log(`🗑️  Uninstalling ${pluginId}...`);

    // Remove from npm if it was installed via npm
    if (plugin.source === "npm" && plugin.npm_package) {
      const pluginDir = path.join(os.homedir(), ".sancus", "plugins");
      try {
        execSync(
          `npm uninstall ${plugin.npm_package} --prefix "${pluginDir}"`,
          {
            stdio: "inherit",
            cwd: pluginDir,
          },
        );
      } catch (error) {
        console.warn(
          `   ⚠️  Warning: Failed to uninstall npm package: ${error}`,
        );
        // Continue anyway - we'll still remove from manifest
      }
    }

    // Remove from manifest
    const removed = await manifest.uninstall(pluginId);
    if (removed) {
      console.log(`✅ Plugin uninstalled successfully`);
    }
  } catch (error: any) {
    console.error(`❌ Uninstallation failed: ${error.message}`);
    throw error;
  }
}

/**
 * Check for updates to installed plugins.
 *
 * Returns a structured map of outdated plugins so callers can act on results.
 * Also prints a human-readable summary to stdout.
 *
 * @param pluginId  Optional — check a single plugin; omit to check all.
 * @returns         Record mapping plugin id to { current, latest } for every
 *                  plugin that has an available update.
 */
export async function checkUpdates(
  pluginId?: string,
): Promise<Record<string, { current: string; latest: string }>> {
  const registry = getRegistryClient();
  const manifest = getManifestManager();
  const outdated: Record<string, { current: string; latest: string }> = {};

  try {
    const installed = await manifest.getInstalled();

    if (installed.length === 0) {
      console.log("📭 No plugins installed");
      return outdated;
    }

    const toCheck = pluginId
      ? installed.filter((p) => p.id === pluginId)
      : installed;

    if (toCheck.length === 0) {
      console.log(`⚠️  Plugin "${pluginId}" not found`);
      return outdated;
    }

    console.log("🔍 Checking for updates...\n");

    for (const plugin of toCheck) {
      const registryEntry = await registry.getPlugin(plugin.id);
      if (!registryEntry) {
        console.log(`⚠️  ${plugin.id}: not found in registry`);
        continue;
      }

      if (registryEntry.version !== plugin.version) {
        outdated[plugin.id] = {
          current: plugin.version,
          latest: registryEntry.version,
        };
        console.log(
          `📦 ${plugin.id}: ${plugin.version} → ${registryEntry.version} available`,
        );
      } else {
        console.log(`✅ ${plugin.id} (v${plugin.version}) is up to date`);
      }
    }

    if (Object.keys(outdated).length > 0) {
      console.log(
        "\n💡 Tip: Run 'sancus plugin upgrade <id>' or 'sancus plugin update --apply' to upgrade",
      );
    }

    return outdated;
  } catch (error: any) {
    console.error(`❌ Update check failed: ${error.message}`);
    throw error;
  }
}

/**
 * Upgrade a plugin to a newer version
 */
export async function upgradePlugin(
  pluginId: string,
  targetVersion?: string,
): Promise<void> {
  const registry = getRegistryClient();
  const manifest = getManifestManager();

  try {
    // Step 1: Get plugin metadata from registry
    const pluginEntry = await registry.getPlugin(pluginId);
    if (!pluginEntry) {
      throw new Error(`Plugin "${pluginId}" not found in registry`);
    }

    // Step 2: Check if currently installed
    const existing = await manifest.getPlugin(pluginId);
    if (!existing) {
      throw new Error(`Plugin "${pluginId}" is not installed`);
    }

    // Step 3: Determine target version
    const newVersion = targetVersion || pluginEntry.version;
    if (existing.version === newVersion) {
      console.log(
        `✅ Plugin "${pluginId}" is already at version ${newVersion}`,
      );
      return;
    }

    // Step 4: Validate compatibility if needed
    if (pluginEntry.requirements?.minNodeVersion) {
      const nodeVersion = process.version;
      console.log(`   Checking compatibility...`);
      // Could add version comparison here
    }

    console.log(
      `📦 Upgrading ${pluginEntry.name} from v${existing.version} to v${newVersion}...`,
    );

    // Step 5: Backup current version info (for potential rollback)
    const backupVersion = existing.version;

    // Step 6: Install new version
    const npmPackage = pluginEntry.npmPackage.name;
    const packageSpec = `${npmPackage}@${newVersion}`;
    const pluginDir = path.join(os.homedir(), ".sancus", "plugins");

    console.log(`   Upgrading npm package: ${packageSpec}`);
    try {
      execSync(`npm install ${packageSpec} --prefix "${pluginDir}" --save`, {
        stdio: "inherit",
        cwd: pluginDir,
      });
    } catch (error) {
      console.error(`❌ Failed to upgrade npm package, rolling back...`);
      // Attempt rollback
      try {
        const rollbackSpec = `${npmPackage}@${backupVersion}`;
        execSync(`npm install ${rollbackSpec} --prefix "${pluginDir}" --save`, {
          stdio: "inherit",
          cwd: pluginDir,
        });
        console.log(`✅ Rolled back to version ${backupVersion}`);
      } catch (rollbackError) {
        console.error(`⚠️  Rollback failed: ${rollbackError}`);
      }
      throw new Error(`Failed to upgrade npm package: ${error}`);
    }

    // Step 7: Verify installation
    const packageJsonPath = path.join(
      pluginDir,
      "node_modules",
      npmPackage,
      "package.json",
    );
    if (!(await fileExists(packageJsonPath))) {
      throw new Error(`Plugin package not found after upgrade`);
    }

    // Step 8: Verify package integrity (no-op when registry entry has no integrity fields)
    const integrityResult = await checkPackageIntegrity(pluginEntry, pluginDir);
    if (!integrityResult.passed) {
      // Integrity failed — rollback to previous version before throwing
      console.error(`❌ Integrity check failed after upgrade, rolling back...`);
      try {
        const rollbackSpec = `${npmPackage}@${backupVersion}`;
        execSync(`npm install ${rollbackSpec} --prefix "${pluginDir}" --save`, {
          stdio: "inherit",
          cwd: pluginDir,
        });
        console.log(`✅ Rolled back to version ${backupVersion}`);
      } catch (rollbackError) {
        console.error(`⚠️  Rollback failed: ${rollbackError}`);
      }
      throw new Error(
        `Package integrity check failed (method: ${integrityResult.method}):\n${integrityResult.error}`,
      );
    }
    if (integrityResult.checked) {
      console.log(`   ✓ Integrity verified (${integrityResult.method})`);
    }

    // Step 9: Update manifest
    await manifest.updateVersion(pluginId, newVersion);

    console.log(`✅ Plugin upgraded successfully`);
    console.log(`   Run 'sancus scan' to reload the plugin`);
  } catch (error: any) {
    console.error(`❌ Upgrade failed: ${error.message}`);
    throw error;
  }
}

/**
 * Helper: Check if file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
