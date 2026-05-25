# Sancus CLI

**Zero‑config, offline, framework‑aware security scanning for Node.js/TypeScript.**

[![npm version](https://badge.fury.io/js/sancus.svg)](https://npmjs.com/package/sancus)
[![License](https://img.shields.io/badge/License-BSL--1.0-blue.svg)](LICENSE)

## Quick start

```bash
npx sancus scan ./your-project
```

## Installation

```bash
npm install -g sancus
# or run directly
npx sancus scan .
```

Sancus detects hardcoded secrets, SQL injection, N+1 queries, prototype pollution, weak crypto, and more – with **zero configuration**.

- ✅ Works on **any Node.js/TypeScript codebase** (single repo or monorepo)
- ✅ **Offline** – no cloud required
- ✅ **Signed audit trail** via Sigstore (provenance for compliance)

## Documentation

- [Installation](#installation)
- [Usage](#usage)
- [Plugins](#plugins) – extend Sancus for your stack
- [License](#license)

## Source availability

Sancus is **source‑available** under the Business Source License (BSL). The core engine is closed source during early development. The **plugin API is fully open** – you can write and share your own detectors.

See [plugin-api/PLUGIN_SPEC.md](plugin-api/PLUGIN_SPEC.md) to get started.

## Contributing

We welcome contributions to the plugin API documentation, examples, and issue reporting. Please read [CONTRIBUTING.md](CONTRIBUTING.md).

## License

Business Source License 1.1 – see [LICENSE](LICENSE) file.