import type { Finding } from '@sancus/plugin-sdk';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Return the 1-based line number for a given character index within `content`.
 */
function lineNumber(content: string, matchIndex: number): number {
  return content.slice(0, matchIndex).split('\n').length;
}

/**
 * Return a short code snippet centred on `line` (1-based) with `ctx` lines of
 * context on each side, joined by newlines.
 */
function snippet(content: string, line: number, ctx = 2): string {
  const lines = content.split('\n');
  const start = Math.max(0, line - 1 - ctx);
  const end = Math.min(lines.length, line - 1 + ctx + 1);
  return lines.slice(start, end).join('\n');
}

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

/**
 * Rule: ruby/marshal-load
 *
 * Marshal.load deserializes arbitrary Ruby objects from a binary string.
 * When the input comes from an untrusted source an attacker can construct a
 * payload that executes arbitrary code during deserialization.
 *
 * Historically exploited in Rails cookie stores and similar attack vectors.
 * Related advisories: CVE-2013-0156 (Rails mass-assignment / type-casting via
 * YAML/Marshal in XML requests).
 */
const MARSHAL_LOAD_RE = /Marshal\.load\s*\(/g;

/**
 * Rule: ruby/yaml-load-unsafe
 *
 * YAML.load (via Psych) can deserialize arbitrary Ruby objects when given
 * crafted YAML that contains !ruby/object tags. YAML.safe_load restricts
 * deserialization to simple scalars and collections and is always preferred.
 *
 * Note: /YAML\.load\s*\(/ does NOT match YAML.safe_load( because "safe_load"
 * is a different method name — the regex requires "load" to be followed
 * immediately by optional whitespace then "(".
 *
 * Related advisories: CVE-2013-0156 (Psych deserialization in Rails XML
 * parameters), CVE-2022-25857.
 */
const YAML_LOAD_RE = /YAML\.load\s*\(/g;

/**
 * Rule: ruby/json-load-unsafe
 *
 * JSON.load (alias: JSON.restore) invokes `object_class` and
 * `create_additions` hooks on the parsed result, which may allow arbitrary
 * object instantiation when parsing attacker-controlled input.
 * JSON.parse is the safe alternative as it does not trigger these hooks by
 * default.
 */
const JSON_LOAD_RE = /JSON\.load\s*\(/g;

// ---------------------------------------------------------------------------
// Exported detector
// ---------------------------------------------------------------------------

export function detectInsecureDeserialization(
  content: string,
  filePath: string,
): Finding[] {
  const findings: Finding[] = [];

  // --- Marshal.load ---
  let match: RegExpExecArray | null;
  MARSHAL_LOAD_RE.lastIndex = 0;
  while ((match = MARSHAL_LOAD_RE.exec(content)) !== null) {
    const line = lineNumber(content, match.index);
    findings.push({
      ruleId: 'ruby/marshal-load',
      severity: 'critical',
      confidence: 'high',
      category: 'Security',
      title: 'Insecure deserialization via Marshal.load',
      message:
        'Marshal.load deserializes arbitrary Ruby objects from binary data. ' +
        'Deserializing attacker-controlled input can lead to remote code execution ' +
        'because Ruby objects can define __send__ and other hooks invoked during ' +
        'deserialization.',
      description:
        'Ruby\'s Marshal module uses a binary format that can encode any Ruby ' +
        'object graph, including Procs and objects whose initialize or marshal_load ' +
        'methods perform dangerous operations. There is no safe subset — any ' +
        'Marshal.load of untrusted data is exploitable.',
      recommendation:
        'Replace Marshal with JSON or MessagePack for data exchange. ' +
        'If you must persist Ruby objects, use a signed/encrypted envelope ' +
        'and verify the signature before deserializing. Never deserialize ' +
        'data from cookies, user requests, or external services with Marshal.',
      location: `${filePath}:${line}`,
      lineRange: String(line),
      codeSnippet: snippet(content, line),
      references: [
        'https://owasp.org/www-community/vulnerabilities/Deserialization_of_untrusted_data',
        'https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2013-0156',
        'https://www.ruby-doc.org/core/Marshal.html',
      ],
    });
  }

  // --- YAML.load (unsafe) ---
  YAML_LOAD_RE.lastIndex = 0;
  while ((match = YAML_LOAD_RE.exec(content)) !== null) {
    const line = lineNumber(content, match.index);
    findings.push({
      ruleId: 'ruby/yaml-load-unsafe',
      severity: 'high',
      confidence: 'high',
      category: 'Security',
      title: 'Insecure deserialization via YAML.load',
      message:
        'YAML.load uses Psych in full-object mode, which allows YAML documents ' +
        'to instantiate arbitrary Ruby objects via !ruby/object: tags. ' +
        'Use YAML.safe_load to restrict deserialization to safe types.',
      description:
        'Psych, the default YAML parser in Ruby, supports a !ruby/object tag ' +
        'that can instantiate any Ruby class during parsing. When YAML is loaded ' +
        'from an untrusted source an attacker can craft a document that executes ' +
        'code via ActiveSupport::Deprecation, ERB, or other gadget chains.',
      recommendation:
        'Replace YAML.load with YAML.safe_load (or YAML.safe_load_file). ' +
        'If you require custom types, use permitted_classes: keyword argument ' +
        'introduced in Psych 4 / Ruby 3.1 to allowlist only known-safe classes.',
      location: `${filePath}:${line}`,
      lineRange: String(line),
      codeSnippet: snippet(content, line),
      references: [
        'https://owasp.org/www-community/vulnerabilities/Deserialization_of_untrusted_data',
        'https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2013-0156',
        'https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2022-25857',
        'https://ruby-doc.org/stdlib/libdoc/psych/rdoc/Psych.html#method-c-safe_load',
      ],
    });
  }

  // --- JSON.load (unsafe) ---
  JSON_LOAD_RE.lastIndex = 0;
  while ((match = JSON_LOAD_RE.exec(content)) !== null) {
    const line = lineNumber(content, match.index);
    findings.push({
      ruleId: 'ruby/json-load-unsafe',
      severity: 'medium',
      confidence: 'medium',
      category: 'Security',
      title: 'Potentially unsafe deserialization via JSON.load',
      message:
        'JSON.load (aliased as JSON.restore) enables the create_additions option ' +
        'and invokes json_create hooks on parsed objects, which may allow ' +
        'arbitrary class instantiation. Prefer JSON.parse for untrusted input.',
      description:
        'Unlike JSON.parse, JSON.load calls Object.json_create on parsed hashes ' +
        'that contain a "json_class" key. In applications that define such hooks ' +
        'on sensitive classes (e.g. Symbol, Struct, ActiveRecord models) this can ' +
        'be leveraged to instantiate unexpected objects.',
      recommendation:
        'Replace JSON.load with JSON.parse. If you need create_additions for ' +
        'internal data exchange, ensure the input is from a trusted and ' +
        'integrity-verified source only.',
      location: `${filePath}:${line}`,
      lineRange: String(line),
      codeSnippet: snippet(content, line),
      references: [
        'https://owasp.org/www-community/vulnerabilities/Deserialization_of_untrusted_data',
        'https://ruby-doc.org/stdlib/libdoc/json/rdoc/JSON.html#method-i-load',
      ],
    });
  }

  return findings;
}
