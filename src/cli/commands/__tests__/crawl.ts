import { CrawlCommandArgs, handler } from '../crawl';
import stream from 'stream';
import os from 'os';
import fs from 'fs';
import Crawler from '../../../crawler';
import DummyDriver from '../../../driver/dummy';
import { FailedAnalysisError } from '../../errors';
import formatJUnit from '../../formatters/junit';
import yargs from 'yargs';

import * as crawlModule from '../crawl';
import TestContext from '../../../testing/TestContext';
import { CrawlerResponse } from '../../../types';

jest.mock('../../formatters/junit', () => {
  return jest.fn(() => 'THIS IS A JUNIT REPORT');
});
jest.mock('../../formatters/console', () => {
  return jest.fn((a, b, opts) => {
    return `CONSOLE_ANALYSIS:${opts.color ? 'color' : 'nocolor'}`;
  });
});

const mockedJUnit = (formatJUnit as unknown) as jest.Mock<typeof formatJUnit>;

function runWithHandler(
  argv: string,
  handler: (argv: CrawlCommandArgs) => void
): Promise<Record<string, unknown>> {
  let invoked = 0;
  const cmd = Object.assign({}, crawlModule, {
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

  it('Executes the crawl', async function() {
    // eslint-disable-next-line
    const crawl = jest.fn(async function*() {});
    const crawler = new Crawler([]);
    const tests = new TestContext();
    crawler.crawl = crawl;
    await handler({ stdout, crawler, tests, concurrency: 1 });
    expect(crawl).toHaveBeenCalledWith(1);
  });

  it('Displays output to indicate the status of the crawl', async function() {
    const crawler = new Crawler(
      [{ url: 'http://example.com' }],
      new DummyDriver()
    );
    await handler({ stdout, crawler, tests: new TestContext() });
    const output = stdout.read().toString();
    expect(output).toMatchSnapshot();
  });

  it('Outputs analysis at the end of the crawl if the output is not silent', async function() {
    const crawler = new Crawler([], new DummyDriver());
    const tests = new TestContext();
    await handler({ stdout, crawler, tests });
    expect(stdout.read().toString()).toContain('CONSOLE_ANALYSIS:color');
  });

  it('Throws an error if the analysis contains failures', async function() {
    const crawler = new Crawler(
      [{ url: 'https://example.com' }],
      new DummyDriver()
    );
    const tests = new TestContext();
    tests.each('testing', () => {
      throw new Error('test');
    });
    await expect(handler({ stdout, crawler, tests })).rejects.toBeInstanceOf(
      FailedAnalysisError
    );
  });

  it('Should stop the crawl if setup fails', async function() {
    const crawler = new Crawler(
      // eslint-disable-next-line require-yield
      (async function*(): AsyncIterable<CrawlerResponse> {
        throw new Error('Oh no!');
      })(),
      new DummyDriver()
    );
    const p = handler({
      stdout,
      crawler,
      tests: new TestContext()
    });
    return expect(p).rejects.toThrow('Oh no!');
  });

  it('Should save a junit report if requested', async function() {
    const filename = `${os.tmpdir()}/nightcrawler-${Math.floor(
      Math.random() * 10000
    )}`;
    const crawler = new Crawler([], new DummyDriver());

    await handler({
      junit: filename,
      stdout,
      crawler,
      tests: new TestContext()
    });
    expect(mockedJUnit).toHaveBeenCalledWith(new Map(), new Map());
    await expect(
      fs.promises.readFile(filename, { encoding: 'utf-8' })
    ).resolves.toEqual('THIS IS A JUNIT REPORT');
    await fs.promises.unlink(filename);
  });

  it('Should save a valid JSON run report if requested', async function() {
    const filename = `${os.tmpdir()}/nightcrawler-${Math.floor(
      Math.random() * 10000
    )}`;
    const crawler = new Crawler([], new DummyDriver());
    await handler({
      json: filename,
      stdout,
      crawler,
      tests: new TestContext()
    });
    await expect(fs.promises.stat(filename)).resolves.toBeTruthy();
    await fs.promises.unlink(filename);
  });
});
