import formatJUnit from '../junit';
import { TestResult } from '../../../testing/TestContext';

function r(obj: { [k: string]: boolean }): TestResult {
  return new Map(Object.entries(obj));
}

describe('JUnit formatter', function() {
  const each = new Map(
    Object.entries({
      ok: r({ ok: true }),
      err: r({ err: false })
    })
  );
  const all = r({
    time: true,
    errors: false
  });

  it('Should output a listing of results', function() {
    expect(formatJUnit(each, all)).toMatchSnapshot();
  });
});
