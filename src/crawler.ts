import bb from 'bluebird';
import Emittery from 'emittery';
import debug from 'debug';
import Analysis from './analysis';
import RequestDriver from './driver/request';

const log = debug('nightcrawler:info');
const error = debug('nightcrawler:error');

import { Driver, CrawlRequest, CrawlResponse, CrawlReport } from './types';

type ResponseSuccessEvent = {
  request: CrawlRequest;
  response: Object;
  data: CrawlResponse;
};
type ResponseErrorEvent = {
  request: CrawlRequest;
  error: Error;
  data: CrawlResponse;
};
type AnalysisEvent = {
  report: CrawlReport;
  analysis: Analysis;
};
type EmitteryEvents = {
  setup: Crawler;
  'response.success': ResponseSuccessEvent;
  'response.error': ResponseErrorEvent;
  analyze: AnalysisEvent;
};

export default class Crawler extends Emittery.Typed<EmitteryEvents> {
  name: string;
  queue: Array<CrawlRequest>;
  driver: Driver;

  constructor(name: string, driver: Driver = new RequestDriver()) {
    super();
    this.name = name;
    this.queue = [];
    this.driver = driver;
  }

  /**
   * Run a full crawl.
   *
   * This is just a shorthand for calling setup then crawl.
   *
   * @returns {Promise.<Bluebird.<U[]>>}
   */
  async crawl(concurrency: number = 3): Promise<CrawlReport> {
    await this.setup();
    return this.work(concurrency);
  }

  /**
   * Invoke setup events.
   *
   * @returns {Promise<Bluebird<Array>|Bluebird<function(*, *=)>>}
   */
  async setup() {
    log(`Starting setup`);
    // Always reset the queue before beginning.
    this.queue = [];
    try {
      await this.emit('setup', this);
      return;
    } catch (e) {
      return Promise.reject(`Setup failed with an error: ${e.toString()}`);
    }
  }

  /**
   * Add a new crawl request to the queue.
   *
   * @param req
   * @returns {Crawler}
   */
  enqueue(req: CrawlRequest | string) {
    this.queue.push(normalizeRequest(req));
    return this;
  }

  /**
   * Work through the queue, fetching requests and returning data for each request.
   *
   * @returns {Promise<Bluebird<U[]>>}
   */
  async work(concurrency: number = 3): Promise<CrawlReport> {
    log(`Starting crawl of ${this.queue.length} urls`);
    const doOne = (cr: CrawlRequest) => this._fetch(cr);
    return {
      name: this.name,
      date: new Date(),
      data: await bb.map(this.queue, doOne, { concurrency })
    };
  }

  /**
   * Execute a single crawl request, returning data for the response.
   *
   * @param req
   * @returns {Promise.<T>}
   */
  async _fetch(req: CrawlRequest): Promise<CrawlResponse> {
    log(`Fetching ${req.url}`);
    let res;

    try {
      res = await this.driver.fetch(req);
    } catch (err) {
      try {
        return await this._collectError(req, err);
      } catch (err) {
        return Promise.reject(
          `An error was caught during processing of a failure result: ${err.toString()}`
        );
      }
    }

    try {
      return await this._collectSuccess(req, res);
    } catch (err) {
      return Promise.reject(
        `An error was caught during processing of a successful result: ${err.toString()}`
      );
    }
  }

  /**
   * Collect a report about a successful response.
   *
   * @param crawlRequest
   * @param response
   * @returns {Promise.<*>}
   */
  async _collectSuccess(
    crawlRequest: CrawlRequest,
    response: Object
  ): Promise<CrawlResponse> {
    log(`Success on ${crawlRequest.url}`);

    let data = Object.assign(
      {},
      crawlRequest,
      { error: false },
      this.driver.collect(response)
    );
    await this.emit('response.success', {
      request: crawlRequest,
      response,
      data
    });
    return data;
  }

  /**
   * Collect a report about an error response.
   *
   * @param crawlRequest
   * @param err
   * @returns {Promise.<*>}
   */
  async _collectError(
    crawlRequest: CrawlRequest,
    err: Error
  ): Promise<CrawlResponse> {
    error(`Error on ${crawlRequest.url}: ${err.toString()}`);
    let data = Object.assign({}, crawlRequest, { error: true });
    await this.emit('response.error', {
      error: err,
      request: crawlRequest,
      data
    });
    return data;
  }

  async analyze(report: CrawlReport): Promise<Analysis> {
    const analysis = new Analysis(report.name, report.date);
    await this.emit('analyze', { report, analysis });
    return analysis;
  }
}

function normalizeRequest(request: CrawlRequest | string) {
  if (typeof request === 'string') {
    return {
      url: request
    };
  }
  return request;
}
