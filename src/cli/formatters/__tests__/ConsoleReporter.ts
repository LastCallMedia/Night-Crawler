import { PassThrough } from 'stream';
import ConsoleReporter from '../ConsoleReporter';
import { makeResult } from '../../util';

describe('Console Formatter', function() {
  const pass = makeResult({
    ok: { pass: true }
  });
  const fail = makeResult({
    notok: { pass: false, message: 'There was an error.' }
  });
  const mix = makeResult({
    ok: { pass: true },
    notok: { pass: false, message: 'something failed' }
  });

  class MockTTY extends PassThrough {
    columns: number;
    constructor() {
      super();
      this.columns = 60;
    }
  }

  let stdout: MockTTY;
  let reporter: ConsoleReporter;

  beforeEach(function() {
    stdout = new MockTTY();
    reporter = new ConsoleReporter(stdout);
  });

  it('Should output successful results', function() {
    reporter.report('http://example.com', pass);
    expect(stdout.read().toString()).toMatchInlineSnapshot(`
      "[42mPASS[49m http://example.com
      "
    `);
  });

  it('Should output failing results', function() {
    reporter.report('failing', fail);
    expect(stdout.read().toString()).toMatchInlineSnapshot(`
"[41mFAIL[49m failing
  * [31mnotok[39m
      There was an error.
"
`);
  });

  it('Should output mixed results', function() {
    reporter.report('mixed', mix);
    expect(stdout.read().toString()).toMatchInlineSnapshot(`
"[41mFAIL[49m mixed
  * [32mok[39m
  * [31mnotok[39m
      something failed
"
`);
  });
});
