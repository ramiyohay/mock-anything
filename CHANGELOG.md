# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] - 2026-01-05

### Added
- `mock(target, key)` core API for temporary method replacement
- `returns(value)` – always return a fixed value
- `throws(error)` – throw an error on invocation
- `resolves(value)` – resolve async methods with a value
- `once()` – apply behavior only on the first call
- `withArgs(...args)` – apply behavior based on exact argument matching
- `called()` – get call count
- `restore()` – restore original method

### Notes
- Initial public release
- No module/import mocking by design
- Explicit and reversible monkey-patching only
