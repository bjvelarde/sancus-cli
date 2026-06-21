import { describe, it, expect } from 'vitest';
import { detectSqlInjection } from './rules/sql-injection.js';
import { detectInsecureDeserialization } from './rules/insecure-deserialization.js';

// =============================================================================
// SQL Injection
// =============================================================================

describe('detectSqlInjection', () => {
  it('detects where() string interpolation', () => {
    const content = `User.where("name = '#{params[:name]}'")`
    const findings = detectSqlInjection(content, 'app/models/user.rb')
    expect(findings.length).toBeGreaterThan(0)
    expect(findings[0].ruleId).toBe('ruby/sql-injection-where-interpolation')
    expect(findings[0].severity).toBe('critical')
    expect(findings[0].location).toBe('app/models/user.rb:1')
  })

  it('detects find_by_sql with string concat', () => {
    const content = `User.find_by_sql("SELECT * FROM users WHERE id = " + user_id)`
    const findings = detectSqlInjection(content, 'app/models/user.rb')
    expect(findings.length).toBeGreaterThan(0)
    expect(findings[0].ruleId).toBe('ruby/sql-injection-find-by-sql')
  })

  it('detects execute() with string interpolation', () => {
    const content = `ActiveRecord::Base.connection.execute("DELETE FROM logs WHERE id = #{params[:id]}")`
    const findings = detectSqlInjection(content, 'app/models/log.rb')
    expect(findings.length).toBeGreaterThan(0)
    expect(findings[0].ruleId).toBe('ruby/sql-injection-raw-execute')
    expect(findings[0].severity).toBe('critical')
  })

  it('returns empty array for safe parameterized query', () => {
    const content = `User.where("name = ?", params[:name])`
    const findings = detectSqlInjection(content, 'app/models/user.rb')
    expect(findings).toHaveLength(0)
  })

  it('returns empty array for hash-syntax where (always safe)', () => {
    const content = `User.where(name: params[:name])`
    const findings = detectSqlInjection(content, 'app/models/user.rb')
    expect(findings).toHaveLength(0)
  })

  it('sets confidence to high for all SQL injection findings', () => {
    const content = `User.where("email = '#{params[:email]}'")`
    const findings = detectSqlInjection(content, 'app/models/user.rb')
    expect(findings[0].confidence).toBe('high')
  })

  it('includes an OWASP reference in SQL injection findings', () => {
    const content = `User.where("id = '#{params[:id]}'")`
    const findings = detectSqlInjection(content, 'app/models/user.rb')
    const hasOwasp = findings[0].references?.some((r) => r.includes('owasp.org'))
    expect(hasOwasp).toBe(true)
  })

  it('detects multiple issues in the same file', () => {
    const content = [
      `User.where("name = '#{params[:name]}'")`,
      `Order.find_by_sql("SELECT * FROM orders WHERE user_id = " + current_user.id)`,
    ].join('\n')
    const findings = detectSqlInjection(content, 'app/models/combo.rb')
    expect(findings.length).toBeGreaterThanOrEqual(2)
  })
})

// =============================================================================
// Insecure Deserialization
// =============================================================================

describe('detectInsecureDeserialization', () => {
  it('detects Marshal.load', () => {
    const content = `obj = Marshal.load(cookie_data)`
    const findings = detectInsecureDeserialization(content, 'app/controllers/sessions_controller.rb')
    expect(findings.length).toBeGreaterThan(0)
    expect(findings[0].ruleId).toBe('ruby/marshal-load')
    expect(findings[0].severity).toBe('critical')
  })

  it('detects YAML.load (unsafe)', () => {
    const content = `config = YAML.load(File.read('config.yml'))`
    const findings = detectInsecureDeserialization(content, 'config/initializers/load.rb')
    expect(findings.length).toBeGreaterThan(0)
    expect(findings[0].ruleId).toBe('ruby/yaml-load-unsafe')
  })

  it('does not flag YAML.safe_load', () => {
    const content = `config = YAML.safe_load(File.read('config.yml'))`
    const findings = detectInsecureDeserialization(content, 'config/load.rb')
    expect(findings).toHaveLength(0)
  })

  it('detects JSON.load', () => {
    const content = `data = JSON.load(request.body)`
    const findings = detectInsecureDeserialization(content, 'app/controllers/api_controller.rb')
    expect(findings.length).toBeGreaterThan(0)
    expect(findings[0].ruleId).toBe('ruby/json-load-unsafe')
  })

  it('does not flag JSON.parse', () => {
    const content = `data = JSON.parse(request.body.read)`
    const findings = detectInsecureDeserialization(content, 'app/controllers/api_controller.rb')
    expect(findings).toHaveLength(0)
  })

  it('Marshal.load finding has confidence high', () => {
    const content = `payload = Marshal.load(Base64.decode64(params[:data]))`
    const findings = detectInsecureDeserialization(content, 'app/controllers/deserialize_controller.rb')
    expect(findings[0].confidence).toBe('high')
  })

  it('YAML.load finding severity is high', () => {
    const content = `data = YAML.load(user_input)`
    const findings = detectInsecureDeserialization(content, 'lib/parser.rb')
    expect(findings[0].severity).toBe('high')
  })

  it('JSON.load finding severity is medium', () => {
    const content = `obj = JSON.load(raw)`
    const findings = detectInsecureDeserialization(content, 'lib/deserializer.rb')
    expect(findings[0].severity).toBe('medium')
  })

  it('includes a CVE reference in Marshal.load finding', () => {
    const content = `Marshal.load(data)`
    const findings = detectInsecureDeserialization(content, 'app/serializer.rb')
    const hasCve = findings[0].references?.some((r) => r.includes('CVE'))
    expect(hasCve).toBe(true)
  })

  it('reports correct file path in location', () => {
    const content = `Marshal.load(data)`
    const findings = detectInsecureDeserialization(content, 'app/controllers/dangerous_controller.rb')
    expect(findings[0].location).toBe('app/controllers/dangerous_controller.rb:1')
  })

  it('detects all three patterns in a single file', () => {
    const content = [
      `obj = Marshal.load(cookie_data)`,
      `cfg = YAML.load(params[:config])`,
      `payload = JSON.load(request.body)`,
    ].join('\n')
    const findings = detectInsecureDeserialization(content, 'app/combined.rb')
    expect(findings).toHaveLength(3)
    const ruleIds = findings.map((f) => f.ruleId)
    expect(ruleIds).toContain('ruby/marshal-load')
    expect(ruleIds).toContain('ruby/yaml-load-unsafe')
    expect(ruleIds).toContain('ruby/json-load-unsafe')
  })
})
