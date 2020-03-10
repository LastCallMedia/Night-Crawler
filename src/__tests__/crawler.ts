import Crawler from '../crawler';
import DummyDriver from '../driver/dummy';
import { performance } from 'perf_hooks';
import { CrawlerRequest } from '../types';
import NativeDriver from '../driver/native';

async function all<T extends unknown>(
  iterator: AsyncIterable<T>
): Promise<T[]> {
  const collected = [];
  for await (const i of iterator) {
    collected.push(i);
  }
  return collected;
}

describe('Crawler', () => {
  it('Should default to the native driver', async () => {
    const c = new Crawler([]);
    expect(c.driver).toBeInstanceOf(NativeDriver);
  });
  it('Should crawl an array of URLs', async () => {
    const c = new Crawler([{ url: 'foo' }], new DummyDriver());
    await expect(all(c.crawl())).resolves.toHaveLength(1);
  });
  it('Should crawl a generator of URLs', async () => {
    const requests = (function*(): Iterable<CrawlerRequest> {
      yield { url: 'foo' };
    })();
    const c = new Crawler(requests, new DummyDriver());
    await expect(all(c.crawl())).resolves.toHaveLength(1);
  });
  it('Should crawl an async generator of URLs', async () => {
    const requests = (async function*(): AsyncIterable<CrawlerRequest> {
      yield { url: 'foo' };
    })();
    const c = new Crawler(requests, new DummyDriver());
    await expect(all(c.crawl())).resolves.toHaveLength(1);
  });

  it('Should respect concurrency in crawling', async () => {
    const requests = (async function*(): AsyncIterable<CrawlerRequest> {
      for (let i = 0; i < 4; i++) {
        yield {
          url: i.toString(),
          delay: 200,
          created: performance.now() as number
        };
      }
    })();
    const start = performance.now();
    const c = new Crawler(requests, new DummyDriver());
    const crawl = await all(c.crawl(2));
    expect(crawl).toHaveLength(4);
    expect(crawl[0].created).toBeLessThan(start + 10);
    expect(crawl[1].created).toBeLessThan(start + 10);
    expect(crawl[2].created).toBeGreaterThan(start + 200);
    expect(crawl[3].created).toBeGreaterThan(start + 200);
  });

  it('Should invoke the success event when requests are successful', async () => {
    const listener = jest.fn(e => {
      e.data.added = true;
    });
    const request = { url: 'foo' };
    const c = new Crawler([request], new DummyDriver());
    c.on('response', listener);
    await all(c.crawl());
    expect(listener).toHaveBeenCalled();
    expect(listener).toHaveBeenCalledWith({
      request: request,
      response: { statusCode: 200 },
      data: {
        ...request,
        added: true,
        error: false,
        driverCollected: true
      }
    });
  });

  it('Should invoke the error event when requests error out', async () => {
    const listener = jest.fn();
    const request = { url: 'foo', shouldFail: true };
    const c = new Crawler([request], new DummyDriver());
    c.on('error', listener);
    await all(c.crawl());
    expect(listener).toHaveBeenCalled();
    expect(listener).toHaveBeenCalledWith({
      request: request,
      error: true,
      data: { ...request, error: true }
    });
  });

  it('Should return errors via the generator', async () => {
    const request = { url: 'foo', shouldFail: 'foo' };
    const c = new Crawler([request], new DummyDriver());
    const result = await all(c.crawl());
    expect(result).toEqual([
      {
        ...request,
        error: 'foo'
      }
    ]);
  });

  it('Should not trigger the error event if an error is thrown during processing of response event', async function() {
    const error = jest.fn();
    const response = jest.fn(() => {
      throw new Error('Test');
    });
    const request = { url: 'foo' };
    const c = new Crawler([request], new DummyDriver());
    c.on('error', error);
    c.on('response', response);
    await expect(all(c.crawl())).resolves.toEqual([
      {
        ...request,
        error: new Error(
          'An error was caught during processing of a successful result: Error: Test'
        )
      }
    ]);
    expect(error).not.toHaveBeenCalled();
  });

  it('Should bubble up errors thrown during processing of error event', async function() {
    const error = jest.fn(() => {
      throw new Error('Rethrown');
    });
    const response = jest.fn();

    const request = { url: 'foo', shouldFail: true };
    const c = new Crawler([request], new DummyDriver());
    c.on('error', error);
    c.on('response', response);
    await expect(all(c.crawl())).resolves.toEqual([
      {
        ...request,
        error: new Error(
          'An error was caught during processing of a failure result: Error: Rethrown'
        )
      }
    ]);
    expect(response).not.toHaveBeenCalled();
  });
});
