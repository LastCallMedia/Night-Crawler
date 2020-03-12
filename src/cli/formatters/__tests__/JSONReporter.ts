import { file } from 'tmp-promise';
import { promises as fs } from 'fs';
import { TestResultMap, TestResult } from '../../../testing/TestContext';
import JSONReporter from '../JSONReporter';

function r(obj: { [k: string]: TestResult }): TestResultMap {
  return new Map(Object.entries(obj));
}

describe('JSON Reporter', function() {
  const pass = r({
    pass: { pass: true }
  });
  const fail = r({
    fail: { pass: false, message: 'There was an error.' }
  });
  const mix = r({
    pass: { pass: true },
    fail: { pass: false, message: 'there was an error.' }
  });

  it('Should write a json file containing results', async function() {
    const { path, cleanup } = await file();
    const reporter = new JSONReporter(path);
    reporter.report('passing', pass);
    reporter.report('failing', fail);
    reporter.report('mixed', mix);
    await expect(reporter.stop()).resolves.toBeUndefined();
    await expect(fs.readFile(path, 'utf8')).resolves.toMatchSnapshot();
    await cleanup();
  });
});
