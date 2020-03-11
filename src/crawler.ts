import debug from 'debug';
import NativeDriver from './driver/native';

const log = debug('nightcrawler:info');
const error = debug('nightcrawler:error');

import { Driver, CrawlerRequest, CrawlerUnit } from './types';

type RequestIterable<T extends CrawlerRequest = CrawlerRequest> =
  | Iterable<T>
  | AsyncIterable<T>;

export default class Crawler {
  driver: Driver;
  iterator: RequestIterable;

  constructor(requests: RequestIterable, driver: Driver = new NativeDriver()) {
    this.iterator = requests;
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

    for await (const crawlerRequest of this.iterator) {
      log(`Sending ${crawlerRequest.url}`);
      const prom = this._fetch(crawlerRequest).then(
        collectToBuffer,
        collectToBuffer
      );
      prom.finally(() => pool.delete(prom));
      pool.add(prom);

      // When we hit max concurrency, stop and wait for the pool to complete.
      if (pool.size >= concurrency) {
        // Wait for a promise to resolve before continuing.
        await Promise.race(pool);
      }
      // Yield all of the buffer results that have accumulated.
      while (buffer.length > 0) {
        yield buffer.pop() as CrawlerUnit;
      }
    }
    // Finish processing the rest of the queue, yielding results as they are ready.
    while (pool.size > 0) {
      await Promise.race(pool);
      // Yield all of the buffer results that have accumulated.
      while (buffer.length > 0) {
        yield buffer.pop() as CrawlerUnit;
      }
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
