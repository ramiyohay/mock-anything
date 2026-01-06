# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2026-01-05

- Added `until(() => bool)` for behavior based on a boolean condition
**please see examples to avoid bugs or loops**
---

## [0.3.0] - 2026-01-05

- Added `onCall(n)` for behavior on call N
- Added `reset()` reset data but keeps the mock

---

## [0.2.0] - 2026-01-05

- Added `times(n)` for temporary behavior
- Added `calledArgs()` to inspect call arguments
- Added `restoreAll()` to restore all mocks at once
- Internal refactor: split modules and improved mode handling


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
