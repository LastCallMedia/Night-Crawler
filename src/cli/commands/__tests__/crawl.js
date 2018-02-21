import { handler } from '../crawl';
import stream from 'stream';
import os from 'os'
import fs from 'fs'
import Crawler from '../../../crawler';
import DummyDriver from '../../../driver/dummy';
import { Number } from '../../../metrics';
import { FailedAnalysisError } from '../../errors';
import JUnitFormatter from '../../formatters/junit';

jest.mock('../../formatters/junit')

describe('Crawl Command', function() {
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

    let called = 0;
    return handler({
      crawlerfile: crawler,
      stdout: new stream.PassThrough()
    })
      .catch(function(err) {
        called++;
        expect(err).toBeInstanceOf(FailedAnalysisError);
      })
      .then(function() {
        expect(called).toEqual(1);
      });
  });

  it('Should save a junit report if requested', function() {
      var filename = `${os.tmpdir()}/nightcrawler-${Math.floor((Math.random() * 10000))}`;
      const crawler = new Crawler('', new DummyDriver);

      return handler({
          crawlerfile: crawler,
          junit: filename
      })
      .then(function() {
        expect(JUnitFormatter).toHaveBeenCalledTimes(1)
        expect(JUnitFormatter.mock.calls[0]).toEqual([filename])
      })
  });

  it('Should save a valid JSON run report if requested', function() {
    var filename = `${os.tmpdir()}/nightcrawler-${Math.floor((Math.random() * 10000))}`;
    const crawler = new Crawler('', new DummyDriver);
    return handler({
        crawlerfile: crawler,
        json: filename
    }).then(function() {
      expect(fs.existsSync(filename)).toEqual(true)
      fs.unlinkSync(filename)
    })
  });
});
