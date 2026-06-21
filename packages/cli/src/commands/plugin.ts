import {
  RegistryClient,
  getManifestManager,
  installPlugin,
  uninstallPlugin,
  checkUpdates,
  upgradePlugin,
} from '@sancus/marketplace';
import type { PluginRegistryEntry, InstalledPlugin } from '@sancus/marketplace';
import { pad, trunc, fmtDate } from '../utils/format.js';

// ---------------------------------------------------------------------------
// Arg parsing helpers
// ---------------------------------------------------------------------------

/**
 * Extract a named flag value: `--flag <value>`.
 * Returns the value string, or `undefined` if the flag is absent.
 * Mutates `args` in-place, removing the flag and its value.
 */
function extractFlagValue(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx === -1) return undefined;
  const value = args[idx + 1];
  if (value === undefined || value.startsWith('--')) {
    console.error(`Error: ${flag} requires a value.`);
    process.exit(1);
  }
  args.splice(idx, 2);
  return value;
}

/**
 * Extract a boolean flag: `--flag`.
 * Returns `true` if present and removes it from `args`.
 */
function extractBoolFlag(args: string[], flag: string): boolean {
  const idx = args.indexOf(flag);
  if (idx === -1) return false;
  args.splice(idx, 1);
  return true;
}

// ---------------------------------------------------------------------------
// Output helpers
// ---------------------------------------------------------------------------

const DIVIDER_SEARCH =
  '\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500';

function printSearchTable(plugins: PluginRegistryEntry[]): void {
  // Column widths
  const W_ID = 22;
  const W_NAME = 30;
  const W_VER = 9;
  const W_CAT = 11;
  const W_VERIFIED = 8;

  const header =
    pad('ID', W_ID) +
    pad('NAME', W_NAME) +
    pad('VERSION', W_VER) +
    pad('CATEGORY', W_CAT) +
    'VERIFIED';

  console.log('');
  console.log(header);
  console.log(DIVIDER_SEARCH);

  for (const p of plugins) {
    const verified = p.metadata?.verified ? '\u2713' : '';
    const row =
      pad(trunc(p.id, W_ID), W_ID) +
      pad(trunc(p.name, W_NAME), W_NAME) +
      pad(p.version, W_VER) +
      pad(trunc(p.category ?? '\u2014', W_CAT), W_CAT) +
      verified;
    console.log(row);
  }

  console.log('');
}

function printListTable(plugins: InstalledPlugin[]): void {
  const W_ID = 22;
  const W_VER = 10;
  const W_STATUS = 10;
  const W_SOURCE = 30;
  // Installed At is the last column — no fixed width needed

  const DIVIDER =
    '\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500';

  const header =
    pad('ID', W_ID) +
    pad('VERSION', W_VER) +
    pad('STATUS', W_STATUS) +
    pad('SOURCE', W_SOURCE) +
    'INSTALLED AT';

  console.log('');
  console.log(header);
  console.log(DIVIDER);

  for (const p of plugins) {
    const status = p.enabled ? 'enabled' : 'disabled';
    const installedAt = fmtDate(p.installed_at);
    const row =
      pad(trunc(p.id, W_ID), W_ID) +
      pad(p.version, W_VER) +
      pad(status, W_STATUS) +
      pad(trunc(p.source ?? '', W_SOURCE), W_SOURCE) +
      installedAt;
    console.log(row);
  }

  console.log('');
}

// ---------------------------------------------------------------------------
// Subcommand handlers
// ---------------------------------------------------------------------------

async function cmdSearch(args: string[]): Promise<void> {
  const query = args[0];
  const registry = new RegistryClient();

  if (query) {
    console.log(`Searching for "${query}"...`);
    const results = await registry.search({ query });
    if (results.length === 0) {
      console.log('No plugins found matching your query.');
      return;
    }
    printSearchTable(results);
    console.log(`${results.length} plugin${results.length === 1 ? '' : 's'} found.`);
  } else {
    console.log('Fetching all available plugins...');
    const results = await registry.listPlugins();
    if (results.length === 0) {
      console.log('No plugins available in the registry.');
      return;
    }
    printSearchTable(results);
    console.log(`${results.length} plugin${results.length === 1 ? '' : 's'} available.`);
  }
}

async function cmdList(_args: string[]): Promise<void> {
  const manifest = getManifestManager();
  const plugins = await manifest.getInstalled();

  if (plugins.length === 0) {
    console.log("No plugins installed. Run 'sancus plugin search' to find plugins.");
    return;
  }

  printListTable(plugins);
  console.log(`${plugins.length} plugin${plugins.length === 1 ? '' : 's'} installed.`);
}

async function cmdInfo(args: string[]): Promise<void> {
  const id = args[0];
  if (!id) {
    console.error('Error: plugin id is required.');
    console.error('Usage: sancus plugin info <id>');
    process.exit(1);
  }

  const registry = new RegistryClient();
  const plugin = await registry.getPlugin(id);

  if (!plugin) {
    console.error(`Error: Plugin "${id}" not found in the registry.`);
    process.exit(1);
  }

  console.log('');
  console.log(`  Name:          ${plugin.name}`);
  console.log(`  ID:            ${plugin.id}`);
  console.log(`  Version:       ${plugin.version}`);
  console.log(`  Description:   ${plugin.description}`);
  console.log(`  Author:        ${plugin.author}`);
  console.log(`  Category:      ${plugin.category}`);
  console.log(`  Tags:          ${Array.isArray(plugin.tags) && plugin.tags.length > 0 ? plugin.tags.join(', ') : '—'}`);
  console.log(`  NPM Package:   ${plugin.npmPackage.name}`);
  console.log(`  Verified:      ${plugin.metadata?.verified ? 'Yes' : 'No'}`);
  if (plugin.requirements?.dependencies && plugin.requirements.dependencies.length > 0) {
    console.log(`  Requirements:  ${plugin.requirements.dependencies.join(', ')}`);
  }
  if (plugin.documentation?.url) {
    console.log(`  Docs:          ${plugin.documentation.url}`);
  }
  console.log('');
}

async function cmdInstall(args: string[]): Promise<void> {
  const version = extractFlagValue(args, '--version');
  const id = args[0];

  if (!id) {
    console.error('Error: plugin id is required.');
    console.error('Usage: sancus plugin install <id> [--version <ver>]');
    process.exit(1);
  }

  console.log(`Installing plugin "${id}"${version ? ` @ ${version}` : ''}...`);
  try {
    await installPlugin(id, version);
    console.log(`Plugin "${id}" installed successfully.`);
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

async function cmdUninstall(args: string[]): Promise<void> {
  const force = extractBoolFlag(args, '--force');
  const id = args[0];

  if (!id) {
    console.error('Error: plugin id is required.');
    console.error('Usage: sancus plugin uninstall <id> [--force]');
    process.exit(1);
  }

  console.log(`Uninstalling plugin "${id}"${force ? ' (forced)' : ''}...`);
  try {
    await uninstallPlugin(id, force);
    console.log(`Plugin "${id}" uninstalled.`);
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

async function cmdUpdate(args: string[]): Promise<void> {
  const id = args[0];

  if (id) {
    console.log(`Checking for updates to "${id}"...`);
  } else {
    console.log('Checking for updates to all installed plugins...');
  }

  try {
    await checkUpdates(id);
    console.log('Done.');
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

async function cmdUpgrade(args: string[]): Promise<void> {
  const version = extractFlagValue(args, '--version');
  const id = args[0];

  if (!id) {
    console.error('Error: plugin id is required.');
    console.error('Usage: sancus plugin upgrade <id> [--version <ver>]');
    process.exit(1);
  }

  console.log(`Upgrading plugin "${id}"${version ? ` to ${version}` : ' to latest'}...`);
  try {
    await upgradePlugin(id, version);
    console.log(`Plugin "${id}" upgraded successfully.`);
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

async function cmdOutdated(_args: string[]): Promise<void> {
  const manifest = getManifestManager();
  const installed = await manifest.getInstalled();

  if (installed.length === 0) {
    console.log('No plugins installed.');
    return;
  }

  // Build { id: version } map for all installed plugins
  const installedMap: Record<string, string> = {};
  for (const p of installed) {
    installedMap[p.id] = p.version;
  }

  const registry = new RegistryClient();
  const outdated = await registry.checkUpdates(installedMap);

  if (!outdated || Object.keys(outdated).length === 0) {
    console.log('All installed plugins are up to date.');
    return;
  }

  console.log('');
  console.log('Outdated plugins:');
  console.log('');
  for (const [id, update] of Object.entries(outdated)) {
    console.log(`  ${id}  ${update.current} \u2192 ${update.latest}`);
  }
  console.log('');
  console.log(`Run \`sancus plugin upgrade <id>\` to upgrade a plugin.`);
}

async function cmdEnable(args: string[]): Promise<void> {
  const id = args[0];
  if (!id) {
    console.error('Error: plugin id is required.');
    console.error('Usage: sancus plugin enable <id>');
    process.exit(1);
  }

  const manifest = getManifestManager();
  try {
    await manifest.enable(id);
    console.log(`Plugin ${id} enabled.`);
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

async function cmdDisable(args: string[]): Promise<void> {
  const id = args[0];
  if (!id) {
    console.error('Error: plugin id is required.');
    console.error('Usage: sancus plugin disable <id>');
    process.exit(1);
  }

  const manifest = getManifestManager();
  try {
    await manifest.disable(id);
    console.log(`Plugin ${id} disabled.`);
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Help
// ---------------------------------------------------------------------------

function printHelp(): void {
  console.log('');
  console.log('Usage: sancus plugin <subcommand> [options]');
  console.log('');
  console.log('Manage Sancus plugins from the registry.');
  console.log('');
  console.log('Subcommands:');
  console.log('');
  console.log('  search [query]               Search the plugin registry (omit query to list all)');
  console.log('  list                         List installed plugins');
  console.log('  info <id>                    Show full details for a plugin');
  console.log('  install <id> [--version v]   Install a plugin (optionally pin a version)');
  console.log('  uninstall <id> [--force]     Remove an installed plugin');
  console.log('  update [id]                  Check for updates (all plugins if id omitted)');
  console.log('  upgrade <id> [--version v]   Upgrade a plugin to latest (or specific version)');
  console.log('  outdated                     List installed plugins with available updates');
  console.log('  enable <id>                  Enable a disabled plugin');
  console.log('  disable <id>                 Disable an installed plugin');
  console.log('');
  console.log('Examples:');
  console.log('  sancus plugin search react');
  console.log('  sancus plugin install hello-world');
  console.log('  sancus plugin install hello-world --version 1.2.0');
  console.log('  sancus plugin upgrade hello-world');
  console.log('  sancus plugin uninstall hello-world --force');
  console.log('  sancus plugin outdated');
  console.log('');
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export async function runPluginCommand(args: string[]): Promise<void> {
  const subcommand = args[0];
  const rest = args.slice(1);

  switch (subcommand) {
    case 'search':
      await cmdSearch(rest);
      break;

    case 'list':
      await cmdList(rest);
      break;

    case 'info':
      await cmdInfo(rest);
      break;

    case 'install':
      await cmdInstall(rest);
      break;

    case 'uninstall':
      await cmdUninstall(rest);
      break;

    case 'update':
      await cmdUpdate(rest);
      break;

    case 'upgrade':
      await cmdUpgrade(rest);
      break;

    case 'outdated':
      await cmdOutdated(rest);
      break;

    case 'enable':
      await cmdEnable(rest);
      break;

    case 'disable':
      await cmdDisable(rest);
      break;

    case '--help':
    case '-h':
    case 'help':
      printHelp();
      break;

    case undefined:
      printHelp();
      break;

    default:
      console.error(`Error: Unknown subcommand "${subcommand}".`);
      printHelp();
      process.exit(1);
  }
}
