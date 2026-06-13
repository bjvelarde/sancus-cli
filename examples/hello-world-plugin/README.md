# Hello World Plugin

This is a minimal example of a Sancus security plugin.

## What It Does

Detects `console.log()` statements in TypeScript and JavaScript files.

## Running

```bash
cd /path/to/sancus-cli
npx sancus scan . --plugins ./examples/hello-world-plugin/index.ts
```

## Key Concepts Demonstrated

✅ **PluginMetadata** - Identifying your plugin  
✅ **File Filtering** - Using glob patterns to scan specific files  
✅ **Detection Logic** - Scanning file content and returning findings  
✅ **Logger Context** - Using context.logger for debugging

## Next Steps

- See [custom-report-plugin](../custom-report-plugin) for postScan() hook usage
- See [framework-detector-plugin](../framework-detector-plugin) for initialize() hook usage
- Read [@sancus/plugin-sdk README](../../packages/plugin-sdk/README.md) for full API reference
