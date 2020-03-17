import debug from 'debug';
import NativeDriver from './driver/native';
import { toAsyncIterable } from './cli/util';

const log = debug('nightcrawler:info');
const error = debug('nightcrawler:error');

import { Driver, CrawlerRequest, CrawlerUnit } from './types';

export type RequestIterable<T extends CrawlerRequest = CrawlerRequest> =
  | Iterable<T>
  | AsyncIterable<T>;

export default class Crawler {
  driver: Driver;
  iterator: AsyncIterable<CrawlerRequest>;

  constructor(requests: RequestIterable, driver: Driver = new NativeDriver()) {
    this.iterator = toAsyncIterable(requests);
    this.driver = driver;
  }

  /**
   * Run a full crawl.
   *
   * This is just a shorthand for calling setup then crawl.
   *
   * @returns {Promise.<Bluebird.<U[]>>}
   */
  async *crawl(concurrency = 3): AsyncGenerator<CrawlerUnit> {
    const pool = new Set<Promise<unknown>>();
    const buffer: CrawlerUnit[] = [];
    const collectToBuffer = (unit: CrawlerUnit): void => {
      buffer.push(unit);
    };

    const iterator = this.iterator[Symbol.asyncIterator]();

    const queueOne = async (): Promise<void> => {
      const next = await iterator.next();
      if (next.value) {
        const prom = this._fetch(next.value)
          .then(collectToBuffer, collectToBuffer)
          .finally(() => pool.delete(prom));
        pool.add(prom);
      }
    };

    // Fill up the pool with N promises to start.
    const initPromises = [];
    for (let i = 0; i < concurrency; i++) {
      initPromises.push(queueOne());
    }
    await Promise.all(initPromises);

    // Work the promise pool until it's empty, adding replacements
    // for every promise we resolve. As promises resolve, results
    // will be pushed onto the buffer, which we then yield.
    while (pool.size > 0) {
      await Promise.race(pool).then(queueOne);
      while (buffer.length > 0) {
        yield buffer.pop() as CrawlerUnit;
      }
    }

    // Yield any leftover buffered results.
    while (buffer.length > 0) {
      yield buffer.pop() as CrawlerUnit;
    }
  }

  /**
   * Execute a single crawl request, returning data for the response.
   *
   * @param req
   * @returns {Promise.<T>}
   */
  async _fetch(req: CrawlerRequest): Promise<CrawlerUnit> {
    log(`Fetching ${req.url}`);

    try {
      const res = await this.driver.fetch(req);
      return {
        request: req,
        response: res
      };
    } catch (err) {
      error(`Received error fetching ${req.url}`);
      return {
        error: err,
        request: req
      };
    }
  }
}
