import * as fs from "fs/promises";
import * as path from "path";
import * as crypto from "crypto";

import type { PluginRegistryEntry } from "./registry-client.js";

/**
 * Result of an integrity check.
 */
export interface IntegrityCheckResult {
  /** Whether the check was performed (false when no integrity fields are present). */
  checked: boolean;
  /** Whether the check passed (always true when checked is false). */
  passed: boolean;
  /** Human-readable description of what was checked. */
  method?: "npmIntegrity" | "sha256";
  /** Error message when passed is false. */
  error?: string;
}

// SRI pattern: sha512-<base64> (npm uses sha512 exclusively)
const SRI_RE = /^sha\d+-[A-Za-z0-9+/]+=*$/;

// sha256 hex: exactly 64 lowercase hex chars
const SHA256_HEX_RE = /^[a-f0-9]{64}$/;

/**
 * Read the npm _integrity field from the installed package's package.json.
 * npm writes the SRI hash of the tarball into package.json as `_integrity`
 * during `npm install`.
 */
async function readNpmIntegrity(
  pluginDir: string,
  npmPackageName: string,
): Promise<string | null> {
  // Scoped packages: @scope/name → node_modules/@scope/name
  const pkgJsonPath = path.join(
    pluginDir,
    "node_modules",
    npmPackageName,
    "package.json",
  );
  try {
    const raw = await fs.readFile(pkgJsonPath, "utf-8");
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (typeof parsed["_integrity"] === "string") {
      return parsed["_integrity"];
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Compute sha256 of every file in the installed package directory and return
 * the hex digest of the concatenated sorted hashes (deterministic, directory-level).
 *
 * This is a best-effort check — it catches file tampering after install, not
 * tarball-level tampering. Tarball-level checks use npmIntegrity.
 */
async function hashInstalledPackage(
  pluginDir: string,
  npmPackageName: string,
): Promise<string> {
  const pkgDir = path.join(pluginDir, "node_modules", npmPackageName);
  const files = await collectFiles(pkgDir);
  files.sort();

  const hasher = crypto.createHash("sha256");
  for (const filePath of files) {
    const content = await fs.readFile(filePath);
    hasher.update(path.relative(pkgDir, filePath));
    hasher.update(content);
  }
  return hasher.digest("hex");
}

async function collectFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  let names: string[];
  try {
    // Read as plain strings to avoid Dirent generic variance issues across Node versions
    names = await fs.readdir(dir);
  } catch {
    return results;
  }
  for (const name of names) {
    const full = path.join(dir, name);
    let stat: import("fs").Stats;
    try {
      stat = await fs.stat(full);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      results.push(...(await collectFiles(full)));
    } else if (stat.isFile()) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Check the integrity of an installed plugin package against the registry entry.
 *
 * Priority:
 *   1. `npmIntegrity` — compare against npm's `_integrity` field in package.json.
 *      This is a tarball-level SRI hash written by npm at install time.
 *   2. `sha256` — compute a deterministic directory hash and compare.
 *   3. Neither field present — skip check (returns checked: false, passed: true).
 *
 * @param entry         Registry entry for the plugin.
 * @param pluginDir     Path to ~/.sancus/plugins (the npm prefix directory).
 */
export async function checkPackageIntegrity(
  entry: PluginRegistryEntry,
  pluginDir: string,
): Promise<IntegrityCheckResult> {
  const npmPackageName = entry.npmPackage.name;

  // ── Method 1: npmIntegrity (SRI from npm tarball) ───────────────────────
  if (entry.npmIntegrity) {
    const actual = await readNpmIntegrity(pluginDir, npmPackageName);

    if (actual === null) {
      return {
        checked: true,
        passed: false,
        method: "npmIntegrity",
        error: `Could not read _integrity from installed package.json for ${npmPackageName}`,
      };
    }

    // npm may write multiple algorithms separated by spaces (e.g. "sha512-... sha1-...")
    // We accept if any token matches the registry value.
    const tokens = actual.split(/\s+/);
    if (!tokens.includes(entry.npmIntegrity)) {
      return {
        checked: true,
        passed: false,
        method: "npmIntegrity",
        error:
          `Integrity mismatch for ${npmPackageName}.\n` +
          `  expected: ${entry.npmIntegrity}\n` +
          `  actual:   ${actual}`,
      };
    }

    return { checked: true, passed: true, method: "npmIntegrity" };
  }

  // ── Method 2: sha256 directory hash ─────────────────────────────────────
  if (entry.sha256) {
    let actual: string;
    try {
      actual = await hashInstalledPackage(pluginDir, npmPackageName);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        checked: true,
        passed: false,
        method: "sha256",
        error: `Failed to hash installed package: ${msg}`,
      };
    }

    if (actual !== entry.sha256) {
      return {
        checked: true,
        passed: false,
        method: "sha256",
        error:
          `SHA-256 mismatch for ${npmPackageName}.\n` +
          `  expected: ${entry.sha256}\n` +
          `  actual:   ${actual}`,
      };
    }

    return { checked: true, passed: true, method: "sha256" };
  }

  // ── No integrity fields — skip ───────────────────────────────────────────
  return { checked: false, passed: true };
}

/**
 * Validate the format of integrity fields on a registry entry.
 * Returns an array of error strings (empty = valid).
 * Used by validate.js and can be imported by TypeScript consumers.
 */
export function validateIntegrityFields(entry: {
  sha256?: string;
  npmIntegrity?: string;
}): string[] {
  const errors: string[] = [];

  if (entry.sha256 !== undefined) {
    if (typeof entry.sha256 !== "string" || !SHA256_HEX_RE.test(entry.sha256)) {
      errors.push(
        `sha256 must be a 64-character lowercase hex string (got: "${entry.sha256}")`,
      );
    }
  }

  if (entry.npmIntegrity !== undefined) {
    if (
      typeof entry.npmIntegrity !== "string" ||
      !SRI_RE.test(entry.npmIntegrity)
    ) {
      errors.push(
        `npmIntegrity must be a valid SRI string (e.g. "sha512-<base64>") (got: "${entry.npmIntegrity}")`,
      );
    }
  }

  return errors;
}
