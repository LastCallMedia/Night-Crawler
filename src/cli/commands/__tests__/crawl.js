import { handler } from '../crawl';
import stream from 'stream';
import os from 'os';
import fs from 'fs';
import Crawler from '../../../crawler';
import DummyDriver from '../../../driver/dummy';
import { Number } from '../../../metrics';
import { FailedAnalysisError } from '../../errors';
import formatJUnit from '../../formatters/junit';
import formatConsole from '../../formatters/console';
import Analysis from '../../../analysis';
import yargs from 'yargs';

jest.mock('../../formatters/junit');
jest.mock('../../formatters/console', () => {
  return jest.fn(
    (_, opts) =>
      `CONSOLE_ANALYSIS:${opts.minLevel}${opts.color ? ':color' : ''}`
  );
});

function runWithHandler(argv, handler) {
  let invoked = 0;
  const cmd = Object.assign({}, require('../crawl'), {
    handler: argv => {
      invoked++;
      handler(argv);
    }
  });

  return new Promise((res, rej) => {
    yargs.command(cmd).parse(argv, (err, argv, output) => {
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
  var stdout;
  beforeEach(function() {
    stdout = new stream.PassThrough();
  });

  it('Executes the crawl', function() {
    let called = 0;
    const crawler = new Crawler();
    crawler.on('setup', () => called++);

    return handler(
      {
        stdout
      },
      crawler
    ).then(function() {
      expect(called).toEqual(1);
    });
  });

  it('Displays output to indicate the success of the crawl', function() {
    const crawler = new Crawler('', new DummyDriver());
    crawler.on('setup', () => {
      crawler.enqueue('http://example.com/');
      crawler.enqueue('http://example.com/');
    });

    return handler(
      {
        stdout
      },
      crawler
    ).then(function() {
      var output = stdout.read().toString();
      expect(output).toMatch('Setup\nCrawl\nAnalyze\n');
    });
  });

  it('Outputs analysis at the end of the crawl if the output is not silent', function() {
    const crawler = new Crawler('', new DummyDriver());

    return handler(
      {
        stdout
      },
      crawler
    ).then(function() {
      expect(stdout.read().toString()).toContain('CONSOLE_ANALYSIS:1:color');
    });
  });

  it('Throws an error if the analysis contains failures', function() {
    const crawler = new Crawler('', new DummyDriver());
    crawler.on('analyze', function(r, a) {
      a.addMetric('foo', new Number('MyTestMetric', 2, 1));
    });

    const p = handler(
      {
        stdout
      },
      crawler
    );
    return expect(p).rejects.toBeInstanceOf(FailedAnalysisError);
  });

  it('Should stop the crawl if setup fails', function() {
    const crawler = {
      setup: jest.fn(() => Promise.reject('Oh no!'))
    };
    const p = handler(
      {
        stdout
      },
      crawler
    );
    return expect(p).rejects.toBe('Oh no!');
  });

  it('Should save a junit report if requested', function() {
    var filename = 'foo';
    const crawler = new Crawler('', new DummyDriver());

    return handler(
      {
        junit: filename,
        stdout
      },
      crawler
    ).then(function() {
      expect(formatJUnit).toHaveBeenCalledTimes(1);
      expect(formatJUnit.mock.calls[0][0]).toBeInstanceOf(Analysis);
      expect(formatJUnit.mock.calls[0][1]).toEqual({ filename: 'foo' });
    });
  });

  it('Should save a valid JSON run report if requested', function() {
    var filename = `${os.tmpdir()}/nightcrawler-${Math.floor(
      Math.random() * 10000
    )}`;
    const crawler = new Crawler('', new DummyDriver());
    return handler(
      {
        json: filename,
        stdout
      },
      crawler
    ).then(function() {
      expect(fs.existsSync(filename)).toEqual(true);
      fs.unlinkSync(filename);
    });
  });
});
