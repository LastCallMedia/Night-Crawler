import { CrawlCommandArgs, handler } from '../crawl';
import stream from 'stream';
import os from 'os';
import fs from 'fs';
import Crawler from '../../../crawler';
import DummyDriver from '../../../driver/dummy';
import { FailedAnalysisError } from '../../errors';
import formatJUnit from '../../formatters/junit';
import Analysis from '../../../analysis';
import yargs from 'yargs';

import * as crawl from '../crawl';

jest.mock('../../formatters/junit', () => {
  return jest.fn(() => 'THIS IS A JUNIT REPORT');
});
jest.mock('../../formatters/console', () => {
  return jest.fn(
    (_, opts) =>
      `CONSOLE_ANALYSIS:${opts.minLevel}${opts.color ? ':color' : ''}`
  );
});

const mockedJUnit = (formatJUnit as unknown) as jest.Mock<typeof formatJUnit>;

function runWithHandler(
  argv: string,
  handler: (argv: CrawlCommandArgs) => void
): Promise<Record<string, unknown>> {
  let invoked = 0;
  const cmd = Object.assign({}, crawl, {
    handler: (argv: CrawlCommandArgs) => {
      invoked++;
      handler(argv);
    }
  });

  return new Promise((res, rej) => {
    yargs
      .command(cmd)
      .parse(argv, (err: Error, argv: Record<string, unknown>) => {
        if (err) return rej(err);
        if (!invoked) return rej(new Error('handler was not invoked'));
        res(argv);
      });
  });
}
describe('Crawl Command', function() {
  it('Has defaults', function() {
    return runWithHandler('crawl', argv => {
      expect(argv.silent).toEqual(false);
      expect(argv.json).toEqual('');
      expect(argv.junit).toEqual('');
      expect(argv.concurrency).toEqual(3);
    });
  });
  it('Passes silent', function() {
    return runWithHandler('crawl --silent', argv => {
      expect(argv.silent).toEqual(true);
    });
  });
  it('Passes junit', function() {
    return runWithHandler('crawl --junit foo/bar.xml', argv => {
      expect(argv.junit).toEqual('foo/bar.xml');
    });
  });
  it('Passes json', function() {
    return runWithHandler('crawl --json foo/bar.json', argv => {
      expect(argv.json).toEqual('foo/bar.json');
    });
  });
  it('Passes concurrency', function() {
    return runWithHandler('crawl --concurrency 5', argv => {
      expect(argv.concurrency).toBe(5);
    });
  });
});

describe('Crawl Handler', function() {
  let stdout: stream.PassThrough;
  beforeEach(function() {
    stdout = new stream.PassThrough();
  });

  it('Executes the crawl', function() {
    let called = 0;
    const crawler = new Crawler('');
    crawler.on('setup', () => called++);

    return handler({
      stdout,
      crawler
    }).then(function() {
      expect(called).toEqual(1);
    });
  });

  it('Displays output to indicate the success of the crawl', function() {
    const crawler = new Crawler('', new DummyDriver());
    crawler.on('setup', () => {
      crawler.enqueue('http://example.com/');
      crawler.enqueue('http://example.com/');
    });

    return handler({
      stdout,
      crawler
    }).then(function() {
      const output = stdout.read().toString();
      expect(output).toMatchSnapshot();
    });
  });

  it('Outputs analysis at the end of the crawl if the output is not silent', function() {
    const crawler = new Crawler('', new DummyDriver());

    return handler({
      stdout,
      crawler
    }).then(function() {
      expect(stdout.read().toString()).toContain('CONSOLE_ANALYSIS:1:color');
    });
  });

  it('Throws an error if the analysis contains failures', function() {
    const crawler = new Crawler('', new DummyDriver());
    crawler.on('analyze', function({ analysis }) {
      analysis.addMetric('failing', {
        level: 2,
        value: 1,
        displayName: 'failing'
      });
    });

    const p = handler({
      stdout,
      crawler
    });
    return expect(p).rejects.toBeInstanceOf(FailedAnalysisError);
  });

  it('Should stop the crawl if setup fails', function() {
    const crawler = new Crawler('', new DummyDriver());
    crawler.setup = jest.fn(() => Promise.reject('Oh no!'));
    const p = handler({
      stdout,
      crawler
    });
    return expect(p).rejects.toBe('Oh no!');
  });

  it('Should save a junit report if requested', async function() {
    const filename = `${os.tmpdir()}/nightcrawler-${Math.floor(
      Math.random() * 10000
    )}`;
    const crawler = new Crawler('', new DummyDriver());

    await handler({
      junit: filename,
      stdout,
      crawler
    });
    expect(mockedJUnit).toHaveBeenCalledTimes(1);
    expect(mockedJUnit.mock.calls[0][0]).toBeInstanceOf(Analysis);
    await expect(
      fs.promises.readFile(filename, { encoding: 'utf-8' })
    ).resolves.toEqual('THIS IS A JUNIT REPORT');
    await fs.promises.unlink(filename);
  });

  it('Should save a valid JSON run report if requested', async function() {
    const filename = `${os.tmpdir()}/nightcrawler-${Math.floor(
      Math.random() * 10000
    )}`;
    const crawler = new Crawler('', new DummyDriver());
    await handler({
      json: filename,
      stdout,
      crawler
    });
    await expect(fs.promises.stat(filename)).resolves.toBeTruthy();
    await fs.promises.unlink(filename);
  });
});
