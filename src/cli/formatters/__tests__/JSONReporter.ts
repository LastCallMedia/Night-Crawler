import { file } from 'tmp-promise';
import { promises as fs } from 'fs';
import JSONReporter from '../JSONReporter';
import { makeResult } from '../../util';

describe('JSON Reporter', function() {
  const pass = makeResult({
    pass: { pass: true }
  });
  const fail = makeResult({
    fail: { pass: false, message: 'There was an error.' }
  });
  const mix = makeResult({
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
