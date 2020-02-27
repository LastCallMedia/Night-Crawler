# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## Unreleased

### Breaking
- HTTP authentication has changed due to the default request driver changing. Now, follow the specifications of the Node http.request method when you construct the Driver.  See https://nodejs.org/api/http.html#http_http_request_url_options_callback
- Some of the return values for the crawler methods have changed. See the example configuration for more information on how to write valid 2.x configuration.

## [1.2.0] - 2020-02-18
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
