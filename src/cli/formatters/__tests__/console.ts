import format from '../console';
import { TestResultMap, TestResult } from '../../../testing/TestContext';

function r(obj: { [k: string]: TestResult }): TestResultMap {
  return new Map(Object.entries(obj));
}

describe('Console Formatter', function() {
  const each = new Map(
    Object.entries({
      ok: r({ ok: { pass: true } }),
      err: r({ err: { pass: false, message: 'failed' } })
    })
  );
  const all = r({
    time: { pass: true },
    errors: { pass: false, message: 'something failed' }
  });

  it('Should output results', function() {
    expect(format(each, all)).toMatchSnapshot();
  });

  it('Should display even when there are no results', function() {
    expect(format(new Map(), new Map())).toMatchSnapshot();
  });
});
