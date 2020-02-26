import ora from 'ora';
import { EOL } from 'os';
import fs from 'fs';
import { FailedAnalysisError } from '../errors';
import formatConsole from '../formatters/console';
import formatJUnit from '../formatters/junit';
import { BuilderCallback } from 'yargs';
import Crawler from '../../crawler';
import { ConfigArgs } from '../index';
import { CrawlReport } from '../../types';
import Analysis from '../../analysis';

export interface CrawlCommandArgs extends ConfigArgs {
  concurrency?: number;
  silent?: boolean;
  json?: string;
  junit?: string;
  stdout?: NodeJS.WritableStream;
}

class CrawlerSpinnerDecorator {
  inner: Crawler;
  stream: NodeJS.WritableStream;
  constructor(inner: Crawler, stream: NodeJS.WritableStream) {
    this.inner = inner;
    this.stream = stream;
  }
  setup(): Promise<void> {
    const promise = this.inner.setup();
    ora.promise(promise, {
      stream: this.stream,
      text: 'Setup'
    });
    return promise;
  }
  work(concurrency: number): Promise<CrawlReport> {
    const promise = this.inner.work(concurrency);
    const spinner = ora.promise(promise, {
      stream: this.stream,
      text: 'Calculating...',
      prefixText: 'Crawling'
    });

    let done = 0;
    const tick = (): void => {
      spinner.text = `Crawled ${++done} of ${this.inner.queue.length}`;
    };
    this.inner.on('response.success', tick);
    this.inner.on('response.error', tick);
    return promise;
  }
  analyze(data: CrawlReport): Promise<Analysis> {
    const promise = this.inner.analyze(data);
    ora.promise(promise, {
      stream: this.stream,
      text: 'Analyze'
    });
    return promise;
  }
}

export const command = 'crawl [crawlerfile]';
export const describe = 'execute the crawl defined in the active config file';
export const builder: BuilderCallback<ConfigArgs, CrawlCommandArgs> = yargs => {
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
export const handler = async function(argv: CrawlCommandArgs): Promise<void> {
  const { crawler, json = '', junit = '', concurrency = 3 } = argv;
  const stdout = argv.stdout ?? process.stdout;
  const spunCrawler = new CrawlerSpinnerDecorator(crawler, stdout);

  await spunCrawler.setup();

  const data = await spunCrawler.work(concurrency);

  const analysis = await spunCrawler.analyze(data);
  stdout.write(formatConsole(analysis, { color: true, minLevel: 1 }) + EOL);

  if (json.length) {
    fs.writeFileSync(json, JSON.stringify(data), 'utf8');
  }

  if (junit.length) {
    fs.writeFileSync(junit, formatJUnit(analysis), 'utf8');
  }

  if (analysis.hasFailures()) {
    throw new FailedAnalysisError('Analysis reported an error');
  }
};
