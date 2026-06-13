# Custom Report Plugin

This example demonstrates the `postScan()` hook for aggregating findings.

## What It Does

1. **Detects** hardcoded environment variables in code
2. **Aggregates** findings across the entire project
3. **Produces** a summary report showing which files have the most issues

## Running

```bash
cd /path/to/sancus-cli
npx sancus scan . --plugins ./examples/custom-report-plugin/index.ts
```

## Key Concepts Demonstrated

✅ **Detect Hook** - Scanning individual files for issues  
✅ **PostScan Hook** - Processing all findings after scanning completes  
✅ **Aggregation** - Grouping and sorting findings by file  
✅ **Custom Reporting** - Creating human-readable summaries

## Expected Output

```
============================================================
Environment Variables Summary Report
============================================================

Total hardcoded environment variables found: 12
Files affected: 4

Top files with hardcoded env vars:
  📄 src/config.ts (8 issues)
  📄 src/api/auth.ts (3 issues)
  📄 src/database.ts (1 issue)

============================================================
```

## Next Steps

- See [framework-detector-plugin](../framework-detector-plugin) for initialize() hook usage
- Read [@sancus/plugin-sdk README](../../packages/plugin-sdk/README.md) for full API reference
