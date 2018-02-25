// @flow

import { requireCrawler } from '../util';
import ora from 'ora';
import { EOL } from 'os';
import fs from 'fs';
import { FailedAnalysisError } from '../errors';
import formatConsole from '../formatters/console';
import formatJUnit from '../formatters/junit';
import type yargs from 'yargs';
import type Crawler from '../../crawler';

type ArgVShape = {
  crawlerfile: string,
  json: string,
  junit: string,
  stdout: Object,
  concurrency: number
};

exports.command = 'crawl [crawlerfile]';
exports.describe = 'execute the crawl defined in the active config file';
exports.builder = (yargs: yargs) => {
  yargs.positional('crawlerfile', {
    describe: 'the name of the crawler file',
    default: './nightcrawler.js',
    type: 'string',
    normalize: true
  });
  yargs.option('concurrency', {
    alias: 'c',
    describe: 'number of requests allowed in-flight at once',
    type: 'number',
    required: true,
    default: 3
  });
  yargs.option('silent', {
    alias: 'n',
    describe: 'silence all output',
    type: 'boolean',
    default: false
  });
  yargs.option('json', {
    alias: 'j',
    describe: 'filename to write JSON report to',
    normalize: true,
    type: 'string',
    default: ''
  });
  yargs.option('junit', {
    alias: 'u',
    describe: 'filename to write JUnit report to',
    normalize: true,
    type: 'string',
    default: ''
  });
};
exports.handler = async function(argv: ArgVShape) {
  const {
    crawlerfile,
    json = '',
    junit = '',
    concurrency = 3,
    stdout = process.stdout
  } = argv;
  const crawler = requireCrawler(crawlerfile);
  const spunCrawler = new CrawlerSpinnerDecorator(crawler, stdout);

  await spunCrawler.setup();

  const data = await spunCrawler.work(concurrency);

  const analysis = await spunCrawler.analyze(data);

  stdout.write(formatConsole(analysis, { color: true, minLevel: 1 }) + EOL);

  if (json.length) {
    fs.writeFileSync(json, JSON.stringify(data), 'utf8');
  }

  if (junit.length) {
    formatJUnit(analysis, { filename: junit });
  }

  if (analysis.hasFailures()) {
    throw new FailedAnalysisError('Analysis reported an error');
  }
};

class CrawlerSpinnerDecorator {
  inner: Crawler;
  stream: Object;
  constructor(inner: Crawler, stream) {
    this.inner = inner;
    this.stream = stream;
  }
  setup() {
    let spinner = ora({
      stream: this.stream
    }).start('Setup');
    // Handle non-TTY by giving some output
    if (!spinner.enabled) {
      this.stream.write(`Setup${EOL}`);
    }
    return this.inner
      .setup()
      .then(res => {
        spinner.succeed('Setup');
        return res;
      })
      .catch(res => {
        spinner.fail('Setup');
        return Promise.reject(res);
      });
  }
  work(concurrency) {
    let spinner = ora({
      stream: this.stream
    }).start('Crawl');
    // Handle non-TTY by giving some output
    if (!spinner.enabled) {
      this.stream.write(`Crawl${EOL}`);
    }
    let done = 0;
    let tick = () => {
      spinner.text = `Crawled ${++done} of ${this.inner.queue.length}`;
    };
    this.inner.on('response.success', tick).on('response.error', tick);

    return this.inner
      .work(concurrency)
      .then(res => {
        spinner.succeed('Crawl');
        return res;
      })
      .catch(res => {
        spinner.fail('Crawl');
        return Promise.reject(res);
      });
  }
  analyze(data) {
    let spinner = ora({
      stream: this.stream
    }).start('Analyze');
    // Handle non-TTY by giving some output
    if (!spinner.enabled) {
      this.stream.write(`Analyze${EOL}`);
    }
    return this.inner
      .analyze(data)
      .then(res => {
        spinner.succeed('Analyze');
        return res;
      })
      .catch(res => {
        spinner.fail('Analyze');
        return Promise.reject(res);
      });
  }
}
