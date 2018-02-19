// @flow

import { requireCrawler, writeJSON } from '../util';
import ora from 'ora';
import { EOL } from 'os';
import { FailedAnalysisError } from '../errors';
import ConsoleFormatter from '../formatters/console';
import JUnitFormatter from '../formatters/junit';
import type yargs from 'yargs';
import type Crawler from '../../crawler';

exports.command = 'crawl [crawlerfile]';
exports.describe = 'execute the crawl defined in the active config file';
exports.builder = (yargs: yargs) => {
  yargs.positional('crawlerfile', {
    describe: 'the name of the crawler file',
    default: 'nightcrawler.js'
  });
  yargs.option('silent', {
    alias: 'n',
    describe: 'silence all output',
    type: 'boolean',
    default: false
  });
  yargs.option('output', {
    alias: 'o',
    describe: 'filename to write JSON report to'
  });
  yargs.option('junit', {
    alias: 'j',
    describe: 'filename to write JUnit report to'
  });
};
exports.handler = async function(argv: Object) {
  const { crawlerfile, output, junit, stdout = process.stdout } = argv;
  const crawler = requireCrawler(crawlerfile);
  const spunCrawler = new CrawlerSpinnerDecorator(crawler, stdout);

  await spunCrawler.setup();

  const data = await spunCrawler.work();

  const analysis = await spunCrawler.analyze(data);

  stdout.write(new ConsoleFormatter().format(analysis));

  if (output) {
    writeJSON(output, data);
  }

  if (junit) {
    new JUnitFormatter(junit).format(analysis);
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
