// @flow

const Promise = require('bluebird');
const request = require('request-promise');
const EventEmitter = require('events-async');
const log = require('debug')('nightcrawler:info');
const error = require('debug')('nightcrawler:error');
import {
  statusCode as statusCodeCollector,
  backendTime as backendTimeCollector
} from './collector';
const Report = require('./report').Report;

export type CrawlRequest = {
  url: string,
  [string]: any
};

export type CrawlResponse = {
  url: string,
  err: boolean,
  [string]: any
};

export type CrawlReport = {
  name: string,
  date: Date,
  data: Array<CrawlResponse>
};

export type ResponseObj = {
  [key: string]: any
};
export type ErrorResponseObj = {
  response: ResponseObj,
  [key: string]: any
};

class Crawler extends EventEmitter {
  constructor(name: string) {
    super();
    this.name = name;
    this.queue = [];
    this.on('response', statusCodeCollector);
    this.on('response', backendTimeCollector);
  }

  /**
   * Run a full crawl.
   *
   * @returns {Promise.<Bluebird.<U[]>>}
   */
  async crawl(concurrency: number): Promise<CrawlReport> {
    concurrency = concurrency || 3;
    // Always reset the queue before beginning.
    this.queue = [];
    await this.setup();
    log(`Beginning crawl of ${this.queue.length} urls`);

    return {
      date: new Date(),
      data: await this.work(concurrency)
    };
  }

  /**
   * Invoke setup events.
   *
   * @returns {Promise<Bluebird<Array>|Bluebird<function(*, *=)>>}
   */
  async setup() {
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
  async work(concurrency: number): Promise<Array<CrawlResponse>> {
    return Promise.map(
      this.queue,
      cr => {
        return this.fetch(cr);
      },
      { concurrency }
    );
  }

  /**
   * Execute a single crawl request, returning data for the response.
   *
   * @param req
   * @returns {Promise.<T>}
   */
  async fetch(req: CrawlRequest): Promise<CrawlResponse> {
    log(`Fetching ${req.url}`);
    return request
      .get({
        url: req.url,
        time: true,
        resolveWithFullResponse: true,
        forever: true // Use keepalive for faster reconnects.
      })
      .then(res => this.collectSuccess(req, res))
      .catch(err => this.collectError(req, err));
  }

  /**
   * Collect a report about a successful response.
   *
   * @param crawlRequest
   * @param response
   * @returns {Promise.<*>}
   */
  async collectSuccess(
    crawlRequest: CrawlRequest,
    response: ResponseObj
  ): Promise<CrawlResponse> {
    log(`Success on ${crawlRequest.url}`);
    let collected = Object.assign({}, crawlRequest, {
      error: false
    });
    await this.emit('response', response, collected);
    return collected;
  }

  /**
   * Collect a report about an error response.
   *
   * @param crawlRequest
   * @param err
   * @returns {Promise.<*>}
   */
  async collectError(
    crawlRequest: CrawlRequest,
    err: ErrorResponseObj
  ): Promise<CrawlResponse> {
    error(`Error on ${crawlRequest.url}`);
    let collected = Object.assign({}, crawlRequest, {
      error: true
    });
    if (err.response) {
      await this.emit('response', err.response, collected);
    }
    return collected;
  }

  async analyze(report: CrawlReport): Promise<Report> {
    const analysis = new Report(report.name, report.date);
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
