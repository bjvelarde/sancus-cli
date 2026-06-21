import type { SancusPlugin, PluginMetadata, ScannedFile, PluginContext, Finding } from '@sancus/plugin-sdk';
import { detectSqlInjection } from './rules/index.js';
import { detectInsecureDeserialization } from './rules/index.js';

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

const metadata: PluginMetadata = {
  id: 'ruby-security-pack',
  name: '@sancus/sample-ruby-security-pack',
  version: '1.0.0',
  author: 'Sancus Team',
  description:
    'Sample Sancus language pack: security detection for Ruby codebases. ' +
    'Detects SQL injection and insecure deserialization patterns in Ruby / Rails applications.',
  repository: 'https://github.com/sancus-cli/sancus-cli',
  homepage: 'https://sancus.dev',
  license: 'MIT',
  keywords: ['ruby', 'rails', 'security', 'language-pack'],
  tags: ['ruby', 'security', 'sql-injection', 'deserialization'],
  // B3 extended fields
  sdkVersion: '1.0.0',
  engineCompatibility: '>=0.2.0',
  capabilities: ['filesystem'],
};

// ---------------------------------------------------------------------------
// Plugin implementation
// ---------------------------------------------------------------------------

const rubySecurityPack: SancusPlugin = {
  metadata,

  // Files this plugin wants to scan
  files: ['**/*.rb', '**/*.rake', '**/Rakefile', '**/Gemfile'],

  // -------------------------------------------------------------------------
  // initialize — check for Gemfile as a project health signal
  // -------------------------------------------------------------------------
  async initialize(context: PluginContext): Promise<void> {
    const gemfilePath = `${context.config.projectRoot}/Gemfile`;

    let gemfileExists = false;
    try {
      await context.fs.readFile(gemfilePath);
      gemfileExists = true;
    } catch {
      // readFile throws when the file does not exist
      gemfileExists = false;
    }

    if (!gemfileExists) {
      context.logger.warn(
        'ruby-security-pack: No Gemfile found at project root. ' +
          'This may not be a Bundler-managed Ruby project. ' +
          'Scanning will continue — Ruby source files will still be analysed.',
      );
    } else {
      context.logger.info('ruby-security-pack: Gemfile found. Initializing Ruby security scan.');
    }
  },

  // -------------------------------------------------------------------------
  // detect — run all rules against the given file
  // -------------------------------------------------------------------------
  async detect(file: ScannedFile, _context: PluginContext): Promise<Finding[]> {
    const findings: Finding[] = [];

    // Only run detection rules on Ruby source files, not Gemfile/Rakefile
    // (Gemfile and Rakefile are included so initialize() can locate them, but
    //  they rarely contain the patterns we detect)
    const sqlFindings = detectSqlInjection(file.content, file.path);
    const deserializationFindings = detectInsecureDeserialization(file.content, file.path);

    findings.push(...sqlFindings, ...deserializationFindings);

    return findings;
  },

  // -------------------------------------------------------------------------
  // postScan — log a summary after all files have been scanned
  // -------------------------------------------------------------------------
  async postScan(findings: Finding[], context: PluginContext): Promise<Finding[]> {
    if (findings.length > 0) {
      context.logger.info(
        `ruby-security-pack: ${findings.length} finding(s) across scanned files`,
      );
    }
    return findings;
  },
};

export default rubySecurityPack;
