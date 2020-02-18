# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Fixed
- Fixes fetches that were successful but resulted in errors during the response.success event were causing response.error to be invoked.

### Changed
- Errors during response.success or response.error will now cause the overall crawl to fail, as this indicates a problem with the invoking code. 

### Deprecated
- Dropped Node 6 support.

## [1.1.1] - 2018-07-11

### Fixed
- Resolve scoping issue in cli/index.js

## [1.1.0] - 2018-07-10

### Changed
- Updated yargs to 12.0.1.
- Moved crawlerfile to a `--config` flag that is required for all commands.
- Updated Ora to 2.0.0.

## [1.0.1] - 2018-02-25

### Fixed
- The top level export (index.js) should have drivers in the form of `[obj].drivers.request` rather than `[obj].driver.request.default`.  If you were referencing drivers with the `default` property, that must be removed.

### Changed
- Reduced verbosity of default console output.  Console output will no longer show URLs that were successful, only ones that failed.
- Added visual indicator of success/warning/failure (✔/!/✖) levels for both metrics and urls.

## [1.0.0] - 2018-02-21
