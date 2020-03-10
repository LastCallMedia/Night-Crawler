import Emittery from 'emittery';
import debug from 'debug';
import NativeDriver from './driver/native';

const log = debug('nightcrawler:info');
const error = debug('nightcrawler:error');

import {
  Driver,
  DriverResponse,
  CrawlerRequest,
  CrawlerResponse
} from './types';

export type ResponseEvent = {
  request: CrawlerRequest;
  response: DriverResponse;
  data: CrawlerResponse;
};
export type ErrorEvent = {
  request: CrawlerRequest;
  error: Error;
  data: CrawlerResponse;
};
type EmitteryEvents = {
  setup: Crawler;
  response: ResponseEvent;
  error: ErrorEvent;
};

type RequestIterable<T extends CrawlerRequest = CrawlerRequest> =
  | Iterable<T>
  | AsyncIterable<T>;

export default class Crawler extends Emittery.Typed<EmitteryEvents> {
  driver: Driver;
  iterator: RequestIterable;

  constructor(requests: RequestIterable, driver: Driver = new NativeDriver()) {
    super();
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
  async *crawl(concurrency = 3): AsyncGenerator<CrawlerResponse> {
    const pool = new Set<Promise<unknown>>();
    const buffer: CrawlerResponse[] = [];
    const collectToBuffer = (res: CrawlerResponse): void => {
      buffer.push(res);
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
        yield buffer.pop() as CrawlerResponse;
      }
    }
    // Finish processing the rest of the queue, yielding results as they are ready.
    while (pool.size > 0) {
      await Promise.race(pool);
      // Yield all of the buffer results that have accumulated.
      while (buffer.length > 0) {
        yield buffer.pop() as CrawlerResponse;
      }
    }
  }

  /**
   * Execute a single crawl request, returning data for the response.
   *
   * @param req
   * @returns {Promise.<T>}
   */
  async _fetch(req: CrawlerRequest): Promise<CrawlerResponse> {
    log(`Fetching ${req.url}`);
    let res;

    try {
      res = await this.driver.fetch(req);
    } catch (err) {
      try {
        return await this._collectError(req, err);
      } catch (err) {
        return {
          ...req,
          error: new Error(
            `An error was caught during processing of a failure result: ${err}`
          )
        };
      }
    }

    try {
      return await this._collectSuccess(req, res);
    } catch (err) {
      return {
        ...req,
        error: new Error(
          `An error was caught during processing of a successful result: ${err}`
        )
      };
    }
  }

  /**
   * Collect a report about a successful response.
   *
   * @param crawlerRequest
   * @param response
   * @returns {Promise.<*>}
   */
  async _collectSuccess(
    crawlerRequest: CrawlerRequest,
    response: DriverResponse
  ): Promise<CrawlerResponse> {
    log(`Success on ${crawlerRequest.url}`);

    const data = Object.assign(
      {},
      crawlerRequest,
      { error: false },
      this.driver.collect(response)
    );
    await this.emit('response', {
      request: crawlerRequest,
      response,
      data
    });
    return data;
  }

  /**
   * Collect a report about an error response.
   *
   * @param crawlerRequest
   * @param err
   * @returns {Promise.<*>}
   */
  async _collectError(
    crawlerRequest: CrawlerRequest,
    err: Error
  ): Promise<CrawlerResponse> {
    error(`Error on ${crawlerRequest.url}: ${err.toString()}`);
    const data = Object.assign({}, crawlerRequest, { error: err });
    await this.emit('error', {
      error: err,
      request: crawlerRequest,
      data
    });
    return data;
  }
}
