import { TestResultMap, TestResult } from '../../testing/TestContext';
import { hasFailure, loadContext } from '../util';
import path from 'path';

jest.mock('../../testing/TestContext');

function r(obj: { [k: string]: TestResult }): TestResultMap {
  return new Map(Object.entries(obj));
}

describe('hasFailure', function() {
  it('Should detect any failure in a test result', function() {
    const result = r({
      fail: { pass: false, message: 'test' }
    });
    expect(hasFailure(result)).toEqual(true);
  });
  it('Should pass test results that have no failures', function() {
    const result = r({
      ok: { pass: true }
    });
    expect(hasFailure(result)).toEqual(false);
  });
  it('Should detect failures in mixed results', function() {
    const result = r({
      ok: { pass: true },
      fail: { pass: false, message: 'test' }
    });
    expect(hasFailure(result)).toEqual(true);
  });
});

describe('loadContext', function() {
  const cwd = path.join(__dirname, '..', '__stubs__');

  it('Should fail when context is not the default export', function() {
    expect(loadContext('./noexport.js', cwd)).rejects.toThrow(
      'The configuration file at ./noexport.js does not export a valid test context.'
    );
  });

  it('Should load when context is the primary export', function() {
    expect(loadContext('./ok.js', cwd)).resolves.toBeTruthy();
  });

  it('Should fail when the config file does not exist', function() {
    expect(loadContext('./nonexistent.js', cwd)).rejects.toThrow(
      'Unable to find configuration file at ./nonexistent.js.'
    );
  });

  it('Should fail when the config file is broken', function() {
    expect(loadContext('./broken.js', cwd)).rejects.toThrow(
      'Cannot find module'
    );
  });
});
