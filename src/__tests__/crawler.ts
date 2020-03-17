import Crawler from '../Crawler';
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
  it('Should throw a meaningful error when an invalid iterator is given', function() {
    expect(() => {
      new Crawler((1 as unknown) as AsyncIterable<CrawlerRequest>);
    }).toThrow('Unable to create an async iterator from the request iterable.');
  });

  it('Should respect concurrency in crawling', async () => {
    /**
     * This test asserts that delays in the driver do not cause pileup.
     * We add a slight delay to each request and verify that they are
     * being pulled from the request iterable at a rate consistent with
     * the driver delay.
     */
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
    expect(crawl[0].request.created).toBeLessThan(start + 10);
    expect(crawl[1].request.created).toBeLessThan(start + 10);
    expect(crawl[2].request.created).toBeGreaterThan(start + 200);
    expect(crawl[3].request.created).toBeGreaterThan(start + 200);
  });

  it('Should respect concurrency in crawling', async () => {
    /**
     * This test checks to make sure we are respecting concurrency settings.
     * It uses the request iterable as a proxy for making sure we don't have
     * too many driver requests in flight at once. This works, because until
     * a request has been yielded, it can't possibly be in flight.
     */
    let yielded = 0;
    const requests = (async function*(): AsyncIterable<CrawlerRequest> {
      for (let i = 0; i < 4; i++) {
        yielded++;
        yield {
          url: i.toString(),
          created: performance.now() as number
        };
      }
    })();
    const c = new Crawler(requests, new DummyDriver());
    const iterator = c.crawl(2);
    await iterator.next();
    // When we've consumed 1 item, there should be 1 resolved, 2 in the pool.
    expect(yielded).toEqual(3);
    await iterator.next();
    // When we've consumed 2 items, there should be 2 resolved, 2 in the pool.
    expect(yielded).toEqual(3);
    await iterator.next();
    // When we've consumed 3 items, there should be 3 resolved, 1 in the pool.
    expect(yielded).toEqual(4);
  });

  it('Should return errors via the generator', async () => {
    const request = { url: 'foo', shouldFail: 'foo' };
    const c = new Crawler([request], new DummyDriver());
    const result = await all(c.crawl());
    expect(result).toEqual([
      {
        request,
        error: 'foo'
      }
    ]);
  });

  it('Should fail if any item in the iterator is not in the shape of a request', async function() {
    const items = ['foo'];
    const crawler = new Crawler(items as Iterable<CrawlerRequest>);
    await expect(all(crawler.crawl(1))).rejects.toThrow(
      'This item does not look like a crawler request: foo'
    );
  });
});
