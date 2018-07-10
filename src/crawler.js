// @flow

const Promise = require('bluebird');
const EventEmitter = require('events-async');
const log = require('debug')('nightcrawler:info');
const error = require('debug')('nightcrawler:error');
import Analysis from './analysis';
import RequestDriver from './driver/request';

import type { Driver, CrawlRequest, CrawlResponse, CrawlReport } from './types';

class Crawler extends EventEmitter {
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
    return this.emit('setup', this);
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
      data: await Promise.map(this.queue, doOne, { concurrency })
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

    return this.driver
      .fetch(req)
      .then(res => this._collectSuccess(req, res))
      .catch(res => this._collectError(req, res));
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

    let collected = Object.assign(
      {},
      crawlRequest,
      { error: false },
      this.driver.collect(response)
    );
    await this.emit('response.success', response, collected);
    return collected;
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
    error(`Error on ${crawlRequest.url}: ${err.message}`);
    let collected = Object.assign(crawlRequest, { error: true });
    await this.emit('response.error', err, collected);
    return collected;
  }

  async analyze(report: CrawlReport): Promise<Analysis> {
    const analysis = new Analysis(report.name, report.date);
    await this.emit('analyze', report, analysis);
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

module.exports = Crawler;
