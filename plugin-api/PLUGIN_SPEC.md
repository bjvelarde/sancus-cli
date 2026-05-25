#### `plugin-api/PLUGIN_SPEC.md`

```markdown
# Sancus Plugin API (Beta)

Sancus plugins allow you to add custom detectors for your framework or application‑specific patterns.

## Plugin structure

A plugin is a JavaScript module that exports a `sancusPlugin` object:

```js
export const sancusPlugin = {
  name: 'my-plugin',
  files: ['**/*.js', '**/*.ts'],  // glob patterns to match
  async detect(file, context) {
    const findings = [];
    // Analyze file.content, file.lines, file.path
    // Return array of finding objects
    return findings;
  },
  async initialize(context) { /* optional */ }
};
```

## Finding object format

```js
{
  type: 'my-custom-issue',
  severity: 'high',   // 'critical', 'high', 'medium', 'low'
  location: `${file.path}:${lineNumber}`,
  lineRange: `${lineNumber}`,
  codeSnippet: '...',
  confidence: 'high',
  severityHint: 'high',
  message: 'Description of the issue',
  recommendation: 'How to fix it',
  category: 'Security', // or 'Performance', 'Reliability', etc.
}
```

## Example

See `examples/simple-plugin.js`.

## Testing your plugin

You can run Sancus with a local plugin:

```bash
npx sancus scan --plugins ./my-plugin.js
```

## Publishing a plugin

You can publish your plugin as an npm package (e.g., `@sancus/plugin-xyz`) and it will be auto‑detected if the corresponding dependency is found in `package.json`. The mapping is defined in the Sancus core config (not open source), but you can contact us to add official support.

For now, users can specify your plugin path manually.