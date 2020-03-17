import JUnitReporter from '../JUnitReporter';
import { file } from 'tmp-promise';
import { promises as fs } from 'fs';
import { makeResult } from '../../util';

describe('JUnit Reporter', function() {
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
  const ansi = makeResult({
    ansi: {
      pass: false,
      message:
        '\u001b[2mexpect(\u001b[22m\u001b[31mreceived\u001b[39m\u001b[2m)'
    }
  });

  it('Should write a junit file containing results', async function() {
    const { path, cleanup } = await file();
    const reporter = new JUnitReporter(path);
    reporter.report('passing', pass);
    reporter.report('failing', fail);
    reporter.report('mixed', mix);
    await expect(reporter.stop()).resolves.toBeUndefined();
    await expect(fs.readFile(path, 'utf8')).resolves.toMatchSnapshot();
    await cleanup();
  });

  it('Should strip ANSI output', async function() {
    const { path, cleanup } = await file();
    const reporter = new JUnitReporter(path);
    reporter.report('ansi', ansi);
    await reporter.stop();
    const contents = await fs.readFile(path, 'utf8');
    await expect(contents).toContain('expect(received)');
    await cleanup();
  });
});
