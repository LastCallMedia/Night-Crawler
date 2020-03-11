import formatJUnit from '../junit';
import { TestResultMap, TestResult } from '../../../testing/TestContext';

function r(obj: { [k: string]: TestResult }): TestResultMap {
  return new Map(Object.entries(obj));
}

describe('JUnit formatter', function() {
  const each = new Map(
    Object.entries({
      ok: r({ ok: { pass: true } }),
      err: r({ err: { pass: false, message: 'something failed' } })
    })
  );
  const all = r({
    time: { pass: true },
    errors: { pass: false, message: 'something failed' }
  });

  it('Should output a listing of results', function() {
    expect(formatJUnit(each, all)).toMatchSnapshot();
  });
});
