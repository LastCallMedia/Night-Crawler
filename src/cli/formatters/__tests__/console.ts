import format from '../console';
import { TestResultMap, TestResult } from '../../../testing/TestContext';

function r(obj: { [k: string]: TestResult }): TestResultMap {
  return new Map(Object.entries(obj));
}

describe('Console Formatter', function() {
  const pass = r({
    ok: { pass: true }
  });
  const fail = r({
    notok: { pass: false, message: 'There was an error.' }
  });
  const mix = r({
    ok: { pass: true },
    notok: { pass: false, message: 'something failed' }
  });

  const opts = { columns: 60 };

  it('Should output results for each URL', function() {
    expect(format('http://example.com', pass, opts)).toMatchInlineSnapshot(`
      "PASS http://example.com
      "
    `);
    expect(format('http://example.com', fail, opts)).toMatchInlineSnapshot(`
      "FAIL http://example.com
        * notok
            There was an error.
      "
    `);
    expect(format('http://example.com', mix, opts)).toMatchInlineSnapshot(`
      "FAIL http://example.com
        * ok
        * notok
            something failed
      "
    `);
  });
});
