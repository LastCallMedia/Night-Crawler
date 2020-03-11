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
      "[42mPASS[49m http://example.com
      "
    `);
    expect(format('http://example.com', fail, opts)).toMatchInlineSnapshot(`
      "[41mFAIL[49m http://example.com
        * [31mnotok[39m
            There was an error.
      "
    `);
    expect(format('http://example.com', mix, opts)).toMatchInlineSnapshot(`
      "[41mFAIL[49m http://example.com
        * [32mok[39m
        * [31mnotok[39m
            something failed
      "
    `);
  });
});
