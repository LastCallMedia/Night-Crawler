import { crawl, test, after } from '../functions';
import TestContext from '../TestContext';
import { mocked } from 'ts-jest/utils';
import Crawler from '../../Crawler';
import { CrawlerRequest } from '../../types';

jest.mock('../TestContext');
jest.mock('../../Crawler');

const MockedContext = mocked(TestContext);
const MockedCrawler = mocked(Crawler);

describe('crawl function', function() {
  beforeEach(function() {
    MockedContext.mockClear();
    MockedCrawler.mockClear();
  });

  it('crawl should create a crawler when an iterable is returned.', async function() {
    const queue = [{ url: 'foo' }];
    const context = await crawl('Test', function() {
      return queue;
    });
    expect(MockedContext).toHaveBeenCalledWith('Test');
    expect(MockedCrawler).toHaveBeenCalledWith(queue);
    expect(context.crawler).toBe(MockedCrawler.mock.instances[0]);
  });

  it('crawl should use a crawler that is returned', async function() {
    const crawler = new Crawler([]);
    const context = await crawl('Test', function() {
      return crawler;
    });
    expect(context.crawler).toBe(crawler);
  });

  it('A crawl function that returns no iterable should result in an error', async function() {
    await expect(
      crawl('Test', function() {
        /* no-op */
      } as () => Iterable<CrawlerRequest>)
    ).rejects.toThrow('This crawl function did not return requests');
  });

  it('A crawl function should be possible to make asynchronous', async function() {
    const asyncFn = async function() {
      return [];
    };
    await expect(crawl('test', asyncFn)).resolves.toBeInstanceOf(TestContext);
  });

  it('Should proxy `test` calls to the context', async function() {
    const fn = jest.fn();
    const context = await crawl('Test', function() {
      test('foo', fn);
      return [];
    });
    expect(mocked(context).test).toHaveBeenCalledWith('foo', fn);
  });

  it('Should proxy `after` calls to the context', async function() {
    const fn = jest.fn();
    const context = await crawl('Test', function() {
      after('foo', fn);
      return [];
    });
    expect(mocked(context).after).toHaveBeenCalledWith('foo', fn);
  });

  it('each should not be callable outside of a crawl function', function() {
    expect(() => test('foo', jest.fn())).toThrow(
      'You may not call "test()" outside of a crawler function.'
    );
  });
  it('after should not be callable outside of a crawl function', function() {
    expect(() => after('foo', jest.fn())).toThrow(
      'You may not call "after()" outside of a crawler function.'
    );
  });
});
