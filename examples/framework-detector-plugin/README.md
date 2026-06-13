# Framework Detector Plugin

This example demonstrates the `initialize()` hook for framework detection.

## What It Does

1. **Detects** if Next.js is installed in the project
2. **Skips** scanning if Next.js is not found (no false positives in non-Next projects)
3. **Scans** only Next.js-specific files (app/ and pages/api/)
4. **Finds** unsafe patterns in Server Actions

## Running

```bash
cd /path/to/sancus-cli
npx sancus scan . --plugins ./examples/framework-detector-plugin/index.ts
```

## Key Concepts Demonstrated

✅ **Initialize Hook** - Setup phase before scanning begins  
✅ **Framework Detection** - Checking for framework presence via package.json  
✅ **Conditional Scanning** - Skip detection if framework not present  
✅ **File Filtering** - Only scanning framework-specific file patterns  
✅ **State Management** - Using plugin state across multiple methods

## How It Works

### 1. Initialize Phase

```typescript
async initialize(context: PluginContext) {
  // Check for Next.js in package.json
  // Set pluginState.hasNext flag
  // Log findings to user
}
```

### 2. Detection Phase

```typescript
async detect(file: ScannedFile) {
  // Skip if Next.js not found
  if (pluginState.skipDetection) return [];

  // Only processes app/ and pages/api/ files
  // Looks for unsafe Server Action patterns
}
```

## Example Findings

```
HIGH  | Server Action Security: Unvalidated JSON parsing in Server Action
      | Location: app/actions.ts:42
      | Recommendation: Validate and sanitize all user inputs before using them in Server Actions
```

## Next Steps

- Read [@sancus/plugin-sdk README](../../packages/plugin-sdk/README.md) for full API reference
- Build your own plugin based on these examples
- Publish to npm to share with the community!
