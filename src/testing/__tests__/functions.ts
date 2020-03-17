import { crawl, test, after } from '../functions';
import TestContext from '../TestContext';
import { mocked } from 'ts-jest/utils';
import Crawler from '../../crawler';
import { CrawlerRequest } from '../../types';

jest.mock('../TestContext');
jest.mock('../../crawler');

const MockedContext = mocked(TestContext);
const MockedCrawler = mocked(Crawler);

describe('crawl function', function() {
  beforeEach(function() {
    MockedContext.mockReset();
    MockedCrawler.mockReset();
  });

  it('crawl should create a crawler when an iterable is returned.', function() {
    const queue = [{ url: 'foo' }];
    const context = crawl('Test', function() {
      return queue;
    });
    expect(MockedContext).toHaveBeenCalledWith('Test');
    expect(MockedCrawler).toHaveBeenCalledWith(queue);
    expect(context.crawler).toBe(MockedCrawler.mock.instances[0]);
  });
  it('crawl should use a crawler that is returned', function() {
    const crawler = new Crawler([]);
    const context = crawl('Test', function() {
      return crawler;
    });
    expect(context.crawler).toBe(crawler);
  });

  it('A crawl function that returns no iterable should result in an error', function() {
    expect(() => {
      crawl('Test', function() {
        /* no-op */
      } as () => Iterable<CrawlerRequest>);
    }).toThrow('This crawl function did not return requests');
  });

  it('Should proxy `test` calls to the context', function() {
    const fn = jest.fn();
    const context = crawl('Test', function() {
      test('foo', fn);
      return [];
    });
    expect(mocked(context).test).toHaveBeenCalledWith('foo', fn);
  });

  it('Should proxy `after` calls to the context', function() {
    const fn = jest.fn();
    const context = crawl('Test', function() {
      after('foo', fn);
      return [];
    });
    expect(mocked(context).after).toHaveBeenCalledWith('foo', fn);
  });

  it('each should not be callable outside of a crawl function', function() {
    expect(() => test('foo', jest.fn())).toThrow(
      'You may not call test outside of a crawler function.'
    );
  });
  it('after should not be callable outside of a crawl function', function() {
    expect(() => after('foo', jest.fn())).toThrow(
      'You may not call after outside of a crawler function.'
    );
  });
});
