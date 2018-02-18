import { handler } from '../crawl';
import Crawler from '../../../crawler';
import DummyDriver from '../../../driver/dummy';
import { Number } from '../../../metrics';
import { FailedAnalysisError } from '../../errors';

describe('Crawl Command', function() {
  it('Executes the crawl', function() {
    let called = 0;
    const crawler = new Crawler();
    crawler.on('setup', () => called++);

    return handler({
      crawlerfile: crawler,
      silent: true
    }).then(function() {
      expect(called).toEqual(1);
    });
  });

  it('Displays output to indicate the success of the crawl', function() {
    // Redirect console output to a spy and silence.
    const spy = jest.spyOn(global.console, 'log');
    spy.mockImplementation(() => {});

    const crawler = new Crawler('', new DummyDriver());
    crawler.on('setup', () => {
      crawler.enqueue('http://example.com/');
      crawler.enqueue('http://example.com/');
    });

    return handler({
      crawlerfile: crawler
    }).then(function() {
      expect(spy.mock.calls.join('\n')).toMatchSnapshot();
    });
  });

  it('Outputs analysis at the end of the crawl if requested', function() {
    // Redirect console output to a spy and silence.
    const spy = jest.spyOn(global.console, 'log');
    spy.mockImplementation(() => {});

    const crawler = new Crawler('', new DummyDriver());
    crawler.on('analyze', function(r, a) {
      a.addMetric('foo', new Number('MyTestMetric', 0, 1));
    });

    return handler({
      crawlerfile: crawler,
      format: 'console',
      silent: true
    }).then(function() {
      console.log(spy.mock.calls);
      expect(spy.mock.calls.join('\n')).toContain('MyTestMetric');
    });
  });

  it('Throws an error if the analysis contains failures', function() {
    // Redirect console output to a spy and silence.
    const spy = jest.spyOn(global.console, 'log');
    spy.mockImplementation(() => {});

    const crawler = new Crawler('', new DummyDriver());
    crawler.on('analyze', function(r, a) {
      a.addMetric('foo', new Number('MyTestMetric', 2, 1));
    });

    let called = 0;
    return handler({
      crawlerfile: crawler,
      format: 'console',
      silent: true
    })
      .catch(function(err) {
        called++;
        expect(err).toBeInstanceOf(FailedAnalysisError);
      })
      .then(function() {
        expect(called).toEqual(1);
      });
  });
});
