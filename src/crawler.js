const Promise = require('bluebird');
const request = require('request-promise');
const EventEmitter = require('events-async');
const log = require('debug')('nightcrawler:info');
const error = require('debug')('nightcrawler:error');
const collectors = require('./collector');
const Report = require('./report').Report;

class Crawler extends EventEmitter {
  /**
   *
   * @param config
   */
  constructor() {
    super();
    this.queue = [];
    this.on('response', collectors.statusCode);
    this.on('response', collectors.backendTime);
  }

  /**
   * Run a full crawl.
   *
   * @returns {Promise.<Bluebird.<U[]>>}
   */
  async crawl(concurrency) {
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

  async close() {
    return this.emit('close');
  }

  /**
   * Add a new crawl request to the queue.
   *
   * @param crawlRequest
   */
  enqueue(crawlRequest) {
    this.queue.push(normalizeRequest(crawlRequest));
    return this;
  }

  /**
   * Work through the queue, fetching requests and returning data for each request.
   *
   * @returns {Promise<Bluebird<U[]>>}
   */
  async work(concurrency) {
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
   * @param cr
   * @returns {Promise<Bluebird<R|U>|Bluebird<R>|Bluebird<{url, groups, error, data}>|Promise.<T>|Bluebird<R|{url, groups, error, data}>>}
   */
  async fetch(crawlRequest) {
    log(`Fetching ${crawlRequest.url}`);
    return request
      .get({
        url: crawlRequest.url,
        time: true,
        resolveWithFullResponse: true,
        forever: true // Use keepalive for faster reconnects.
      })
      .then(r => this.collectSuccess(crawlRequest, r))
      .catch(e => this.collectError(crawlRequest, e));
  }

  /**
   * Collect a report about a successful response.
   *
   * @param crawlRequest
   * @param response
   * @returns {{url: (*|(()=>string)|string), groups: (*|Array), error: boolean, data: *}}
   */
  async collectSuccess(crawlRequest, response) {
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
   * @returns {{url: (*|(()=>string)|string), groups: (*|Array), error: boolean, data: {}}}
   */
  async collectError(crawlRequest, err) {
    error(`Error on ${crawlRequest.url}`);
    let collected = Object.assign({}, crawlRequest, {
      error: true
    });
    if (err.response) {
      await this.emit('response', err.response, collected);
    }
    return collected;
  }

  async analyze(crawlReport) {
    var report = new Report(crawlReport.date);
    await this.emit('analyze', crawlReport, report);
    return report;
  }
}

function normalizeRequest(request) {
  if (typeof request === 'string') {
    request = {
      url: request
    };
  }
  if (typeof request.url !== 'string') {
    throw new Error('The request URL must be a string.');
  }
  return request;
}

module.exports = Crawler;
