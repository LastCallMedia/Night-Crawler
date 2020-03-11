import { TestResultMap, TestResult } from '../../testing/TestContext';
import { hasFailure } from '../util';

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
