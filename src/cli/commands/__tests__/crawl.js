import { handler } from '../crawl';
import stream from 'stream';
import os from 'os';
import fs from 'fs';
import Crawler from '../../../crawler';
import DummyDriver from '../../../driver/dummy';
import { Number } from '../../../metrics';
import { FailedAnalysisError } from '../../errors';
import JUnitFormatter from '../../formatters/junit';
import yargs from 'yargs';

jest.mock('../../formatters/junit');

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
      expect(argv.crawlerfile).toEqual('./nightcrawler.js');
      expect(argv.json).toEqual('');
      expect(argv.junit).toEqual('');
    });
  });
  it('Passes silent', function() {
    return runWithHandler('crawl --silent', argv => {
      expect(argv.silent).toEqual(true);
    });
  });
  it('Passes crawlerfile', function() {
    return runWithHandler('crawl ./foo.js', argv => {
      expect(argv.crawlerfile).toEqual('foo.js');
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
});

describe('Crawl Handler', function() {
  it('Executes the crawl', function() {
    let called = 0;
    const crawler = new Crawler();
    crawler.on('setup', () => called++);

    return handler({
      crawlerfile: crawler,
      stdout: new stream.PassThrough()
    }).then(function() {
      expect(called).toEqual(1);
    });
  });

  it('Displays output to indicate the success of the crawl', function() {
    var stdout = new stream.PassThrough();

    const crawler = new Crawler('', new DummyDriver());
    crawler.on('setup', () => {
      crawler.enqueue('http://example.com/');
      crawler.enqueue('http://example.com/');
    });

    return handler({
      crawlerfile: crawler,
      stdout
    }).then(function() {
      expect(stdout.read().toString()).toMatchSnapshot();
    });
  });

  it('Outputs analysis at the end of the crawl if requested', function() {
    var stdout = new stream.PassThrough();

    const crawler = new Crawler('', new DummyDriver());
    crawler.on('analyze', function(r, a) {
      a.addMetric('foo', new Number('MyTestMetric', 0, 1));
    });

    return handler({
      crawlerfile: crawler,
      stdout
    }).then(function() {
      expect(stdout.read().toString()).toContain('MyTestMetric');
    });
  });

  it('Throws an error if the analysis contains failures', function() {
    const crawler = new Crawler('', new DummyDriver());
    crawler.on('analyze', function(r, a) {
      a.addMetric('foo', new Number('MyTestMetric', 2, 1));
    });

    const p = handler({
      crawlerfile: crawler,
      stdout: new stream.PassThrough()
    });
    return expect(p).rejects.toBeInstanceOf(FailedAnalysisError);
  });

  it('Should stop the crawl if setup fails', function() {
    const crawler = {
      setup: jest.fn(() => Promise.reject('Oh no!'))
    };
    const p = handler({
      crawlerfile: crawler,
      stdout: new stream.PassThrough()
    });
    return expect(p).rejects.toBe('Oh no!');
  });

  it('Should save a junit report if requested', function() {
    var filename = `${os.tmpdir()}/nightcrawler-${Math.floor(
      Math.random() * 10000
    )}`;
    const crawler = new Crawler('', new DummyDriver());

    return handler({
      crawlerfile: crawler,
      junit: filename,
      stdout: new stream.PassThrough()
    }).then(function() {
      expect(JUnitFormatter).toHaveBeenCalledTimes(1);
      expect(JUnitFormatter.mock.calls[0]).toEqual([filename]);
    });
  });

  it('Should save a valid JSON run report if requested', function() {
    var filename = `${os.tmpdir()}/nightcrawler-${Math.floor(
      Math.random() * 10000
    )}`;
    const crawler = new Crawler('', new DummyDriver());
    return handler({
      crawlerfile: crawler,
      json: filename,
      stdout: new stream.PassThrough()
    }).then(function() {
      expect(fs.existsSync(filename)).toEqual(true);
      fs.unlinkSync(filename);
    });
  });
});
