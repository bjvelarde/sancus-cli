#!/usr/bin/env node
'use strict';

/**
 * validate.js — Sancus Plugin Registry Validator
 *
 * Self-contained CJS script. No external dependencies.
 * Run from the plugin-registry/ directory:
 *   node validate.js
 *
 * Exit 0 on success, 1 on failure.
 */

const fs   = require('fs');
const path = require('path');

// ── Constants ────────────────────────────────────────────────────────────────

const REQUIRED_FIELDS = ['id', 'name', 'version', 'description', 'author', 'npmPackage'];

const VALID_CATEGORIES = ['framework', 'rules', 'reporting', 'utilities', 'language', 'integration'];

// Semver: MAJOR.MINOR.PATCH with optional pre-release and build metadata
const SEMVER_RE = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

// Plugin id: lowercase alphanumerics and hyphens only, 3-50 chars
const ID_RE = /^[a-z0-9-]+$/;

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns all URLs found inside an entry object (flat scan of known URL fields).
 */
function collectUrls(entry) {
  const urls = [];
  if (entry.repository) urls.push({ field: 'repository', value: entry.repository });
  if (entry.npmPackage && entry.npmPackage.url)       urls.push({ field: 'npmPackage.url',        value: entry.npmPackage.url });
  if (entry.documentation) {
    if (entry.documentation.url)       urls.push({ field: 'documentation.url',       value: entry.documentation.url });
    if (entry.documentation.readme)    urls.push({ field: 'documentation.readme',    value: entry.documentation.readme });
    if (entry.documentation.changelog) urls.push({ field: 'documentation.changelog', value: entry.documentation.changelog });
  }
  return urls;
}

/**
 * Validates a single registry entry. Returns an array of error strings.
 */
function validateEntry(key, entry) {
  const errors = [];

  // 1. Required fields
  for (const field of REQUIRED_FIELDS) {
    if (entry[field] === undefined || entry[field] === null) {
      errors.push(`missing required field: ${field}`);
    }
  }

  // Stop early if required fields are missing — subsequent checks may crash
  if (errors.length > 0) return errors;

  // 2. id must match the registry key
  if (entry.id !== key) {
    errors.push(`id "${entry.id}" does not match registry key "${key}"`);
  }

  // 3. id must match pattern
  if (!ID_RE.test(entry.id)) {
    errors.push(`id "${entry.id}" does not match pattern /^[a-z0-9-]+$/`);
  }

  // 4. id length 3-50
  if (entry.id.length < 3 || entry.id.length > 50) {
    errors.push(`id "${entry.id}" length must be between 3 and 50 characters`);
  }

  // 5. version must be valid semver
  if (typeof entry.version !== 'string' || !SEMVER_RE.test(entry.version)) {
    errors.push(`version "${entry.version}" is not valid semver`);
  }

  // 6. npmPackage.name must be a non-empty string
  if (typeof entry.npmPackage !== 'object' || entry.npmPackage === null) {
    errors.push('npmPackage must be an object');
  } else if (typeof entry.npmPackage.name !== 'string' || entry.npmPackage.name.trim() === '') {
    errors.push('npmPackage.name must be a non-empty string');
  }

  // 7. category, if present, must be one of the valid values
  if (entry.category !== undefined) {
    if (!VALID_CATEGORIES.includes(entry.category)) {
      errors.push(`category "${entry.category}" is not one of: ${VALID_CATEGORIES.join(', ')}`);
    }
  }

  // 8. All URLs must start with https://
  const urls = collectUrls(entry);
  for (const { field, value } of urls) {
    if (typeof value !== 'string' || !value.startsWith('https://')) {
      errors.push(`${field} must start with "https://" (got: "${value}")`);
    }
  }

  return errors;
}

// ── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const registryPath = path.join(__dirname, 'registry.json');
  const schemaPath   = path.join(__dirname, 'schema.json');

  // Load files
  let registry, schema; // eslint-disable-line no-unused-vars
  try {
    registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  } catch (err) {
    console.error(`Error loading registry.json: ${err.message}`);
    process.exit(1);
  }
  try {
    schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  } catch (err) {
    console.error(`Error loading schema.json: ${err.message}`);
    process.exit(1);
  }

  console.log('Validating plugin-registry/registry.json against schema...\n');

  const keys = Object.keys(registry);
  let totalErrors = 0;

  for (const key of keys) {
    const entry  = registry[key];
    const errors = validateEntry(key, entry);

    if (errors.length === 0) {
      console.log(`\u2713 ${key} \u2014 valid`);
    } else {
      for (const err of errors) {
        console.log(`\u2717 ${key} \u2014 ${err}`);
      }
      totalErrors += errors.length;
    }
  }

  console.log('');

  if (totalErrors === 0) {
    console.log(`Registry validation passed. ${keys.length} entries validated.`);
    process.exit(0);
  } else {
    console.log(`Registry validation FAILED. ${totalErrors} error(s).`);
    process.exit(1);
  }
}

main();
