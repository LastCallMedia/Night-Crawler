import TestContext from '../TestContext';
import Crawler from '../../crawler';
import { CrawlerUnit } from '../../types';
import { makeResult } from '../../cli/util';
import { mocked } from 'ts-jest/utils';

jest.mock('../../crawler');

async function all<T extends unknown>(
  iterator: AsyncIterable<T>
): Promise<T[]> {
  const collected = [];
  for await (const i of iterator) {
    collected.push(i);
  }
  return collected;
}

describe('TestContext', function() {
  const units = [
    { request: { url: 'foo', groups: ['foo'] } },
    { request: { url: 'bar', groups: ['bar'] } }
  ];
  const crawler = new Crawler([]);
  crawler.crawl = jest.fn(async function*() {
    yield* [
      { request: { url: 'foo', groups: ['foo'] } },
      { request: { url: 'bar', groups: ['bar'] } }
    ];
  });
  const failingCrawler = new Crawler([]);
  failingCrawler.crawl = jest.fn(async function*() {
    yield* [{ request: { url: 'foo' }, error: new Error('Request failure') }];
  });

  it('Should require a crawler to run', async () => {
    const context = new TestContext('');
    await expect(all(context.crawl(1))).rejects.toThrow(
      'crawl was invoked without a valid crawler'
    );
  });

  it('Should pass concurrency to crawler', async () => {
    const context = new TestContext('');
    context.crawler = crawler;
    await all(context.crawl(21));
    expect(mocked(crawler).crawl).toHaveBeenCalledWith(21);
  });

  it('Should invoke "test" handlers', async () => {
    const handler = jest.fn();
    const context = new TestContext('');
    context.crawler = crawler;
    context.test('Test', handler);
    await all(context.crawl(1));
    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenCalledWith(units[0]);
    expect(handler).toHaveBeenCalledWith(units[1]);
  });

  it('Should invoke "after" handlers', async () => {
    const handler = jest.fn();
    const context = new TestContext('');
    context.crawler = crawler;
    context.after('Test', handler);
    await all(context.crawl(1));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('Should return results from `test` handlers', async () => {
    const handler = jest.fn((unit: CrawlerUnit) => {
      if (unit.request.url === 'foo') {
        throw new Error('test error');
      }
    });
    const context = new TestContext('');
    context.crawler = crawler;
    context.test('Test', handler);
    const results = await all(context.crawl(1));
    expect(results[0]).toEqual([
      'foo',
      makeResult({
        Test: { pass: false, message: 'Error: test error' }
      })
    ]);
    expect(results[1]).toEqual([
      'bar',
      makeResult({
        Test: { pass: true }
      })
    ]);
  });

  it('Should return results from `after` handlers', async () => {
    const context = new TestContext('');
    context.crawler = crawler;
    context.after('failing', () => {
      throw new Error('fail');
    });
    context.after('passing', () => {
      // no-op.
    });
    const results = await all(context.crawl(1));
    expect(results[2]).toEqual([
      'All',
      makeResult({
        failing: { pass: false, message: 'Error: fail' },
        passing: { pass: true }
      })
    ]);
  });

  it('Should not invoke test handlers when requests fail.', async () => {
    const handler = jest.fn();
    const context = new TestContext('');
    context.crawler = failingCrawler;
    context.test('test', handler);
    await all(context.crawl(1));
    expect(handler).not.toHaveBeenCalled();
  });

  it('Should return a meaningful result when requests fail.', async () => {
    const context = new TestContext('');
    context.crawler = failingCrawler;
    const result = await all(context.crawl(1));
    expect(result[0]).toEqual([
      'foo',
      makeResult({
        'Request Failure': { pass: false, message: 'Error: Request failure' }
      })
    ]);
  });
});
