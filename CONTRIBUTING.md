# Contributing to Sancus

Thank you for your interest!

## Ways to contribute

- **Report bugs** – open an issue.
- **Suggest enhancements** – open an issue.
- **Improve documentation** – PRs to `plugin-api/` or `examples/`.
- **Write plugins** – share your plugin via npm (we may add it to the official registry).
- **Improve SDK** – contribute to `packages/plugin-sdk/` (unit tests required).

## Testing Requirements

**All contributions must include passing tests.** We use **Vitest** for unit testing.

### For plugin-sdk contributions:

```bash
cd packages/plugin-sdk
pnpm test          # Run all tests
pnpm test:coverage # Check coverage (80% minimum)
pnpm test:ui       # Interactive UI mode
```

### Guidelines:

- ✅ Write tests for new features
- ✅ Maintain 80%+ test coverage
- ✅ All tests must pass before PR merge
- ✅ Update tests if you modify existing behavior

### For example plugins:

- Include usage examples and documentation
- Test your plugin against real projects
- Verify glob patterns work as intended

## Core engine

The core scanning engine is not open source at this time. However, the **plugin API** is fully documented and we encourage contributions there.

## Code of conduct

Be respectful. We will enforce a standard code of conduct.
