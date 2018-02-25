# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).


## [1.0.1] - 2018-02-25

### Fixed
- The top level export (index.js) should have drivers in the form of `[obj].drivers.request` rather than `[obj].driver.request.default`.  If you were referencing drivers with the `default` property, that must be removed.

### Changed
- Reduced verbosity of default console output.  Console output will no longer show URLs that were successful, only ones that failed.
- Added visual indicator of success/warning/failure (✔/!/✖) levels for both metrics and urls.

## [1.0.0] - 2018-02-21
