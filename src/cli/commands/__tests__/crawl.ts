import { CrawlCommandArgs, handler } from '../crawl';
import stream from 'stream';
import Crawler from '../../../crawler';
import DummyDriver from '../../../driver/dummy';
import { FailedAnalysisError } from '../../errors';
import yargs from 'yargs';

import * as crawlModule from '../crawl';
import TestContext from '../../../testing/TestContext';
import { CrawlerRequest } from '../../../types';

import ConsoleReporter from '../../formatters/ConsoleReporter';
import JUnitReporter from '../../formatters/JUnitReporter';
import JSONReporter from '../../formatters/JSONReporter';

import { mocked } from 'ts-jest';

jest.mock('../../formatters/JUnitReporter');
jest.mock('../../formatters/ConsoleReporter');
jest.mock('../../formatters/JSONReporter');

const MockedConsoleReporter = mocked(ConsoleReporter);
const MockedJUnitReporter = mocked(JUnitReporter);
const MockedJSONReporter = mocked(JSONReporter);

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

class MockTTY extends stream.PassThrough {
  columns: number;
  constructor() {
    super();
    this.columns = 60;
  }
}

describe('Crawl Handler', function() {
  let stdout: MockTTY;

  beforeEach(function() {
    stdout = new MockTTY();
    MockedConsoleReporter.mockReset();
    MockedJUnitReporter.mockReset();
    MockedJSONReporter.mockReset();
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

  it('Displays console output.', async function() {
    const crawler = new Crawler(
      [{ url: 'http://example.com' }],
      new DummyDriver()
    );
    const tests = new TestContext();
    tests.each('Testing', () => {
      throw new Error('Test');
    });
    tests.all('Testing', () => {
      throw new Error('Test');
    });
    try {
      await handler({ stdout, crawler, tests });
    } catch (e) {
      // no-op - we don't care.
    }
    expect(MockedConsoleReporter).toHaveBeenCalled();
    const reporter = MockedConsoleReporter.mock.instances[0];
    expect(reporter.start).toHaveBeenCalledTimes(1);
    expect(reporter.report).toHaveBeenCalledTimes(2);
    expect(reporter.stop).toHaveBeenCalledTimes(1);
  });

  it('Writes a JUnit report', async function() {
    const crawler = new Crawler(
      [{ url: 'http://example.com' }],
      new DummyDriver()
    );
    const tests = new TestContext();
    tests.each('Testing', () => {
      throw new Error('Test');
    });
    tests.all('Testing', () => {
      throw new Error('Test');
    });
    try {
      await handler({ stdout, crawler, tests, junit: 'test' });
    } catch (e) {
      // no-op - we don't care.
    }
    expect(MockedJUnitReporter).toHaveBeenCalled();
    const reporter = MockedJUnitReporter.mock.instances[0];
    expect(reporter.start).toHaveBeenCalledTimes(1);
    expect(reporter.report).toHaveBeenCalledTimes(2);
    expect(reporter.stop).toHaveBeenCalledTimes(1);
  });

  it('Writes a JSON report', async function() {
    const crawler = new Crawler(
      [{ url: 'http://example.com' }],
      new DummyDriver()
    );
    const tests = new TestContext();
    tests.each('Testing', () => {
      throw new Error('Test');
    });
    tests.all('Testing', () => {
      throw new Error('Test');
    });
    try {
      await handler({ stdout, crawler, tests, json: 'test' });
    } catch (e) {
      // no-op - we don't care.
    }
    expect(MockedJSONReporter).toHaveBeenCalled();
    const reporter = MockedJSONReporter.mock.instances[0];
    expect(reporter.start).toHaveBeenCalledTimes(1);
    expect(reporter.report).toHaveBeenCalledTimes(2);
    expect(reporter.stop).toHaveBeenCalledTimes(1);
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
      (async function*(): AsyncIterable<CrawlerRequest> {
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
});
