import format from '../console';
import { TestResult } from '../../../testing/TestContext';

function r(obj: { [k: string]: boolean }): TestResult {
  return new Map(Object.entries(obj));
}

describe('Console Formatter', function() {
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

  it('Should output results', function() {
    expect(format(each, all)).toMatchSnapshot();
  });

  it('Should display even when there are no results', function() {
    expect(format(new Map(), new Map())).toMatchSnapshot();
  });
});
