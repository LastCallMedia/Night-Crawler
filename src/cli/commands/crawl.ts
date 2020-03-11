import ora from 'ora';
import { EOL } from 'os';
import { writeFile } from 'fs';
import { promisify } from 'util';
import { FailedAnalysisError } from '../errors';
import formatConsole from '../formatters/console';
import formatJUnit from '../formatters/junit';
import { BuilderCallback } from 'yargs';
import { ConfigArgs } from '../index';
import { TestResult } from '../../testing/TestContext';
import { hasFailure } from '../util';

const writeFileP = promisify(writeFile);

export interface CrawlCommandArgs extends ConfigArgs {
  concurrency?: number;
  silent?: boolean;
  json?: string;
  junit?: string;
  stdout?: NodeJS.WritableStream;
}

export const command = 'crawl [crawlerfile]';
export const describe =
  'crawls a defined set of URLs and runs tests against the received responses.';
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
  const { crawler, tests, json = '', junit = '', concurrency = 3 } = argv;
  const stdout = argv.stdout ?? process.stdout;
  const spinner = ora({
    stream: stdout,
    prefixText: 'Crawling'
  }).start('Starting');

  const eachResults = new Map<string, TestResult>();
  const allUnits = [];

  for await (const unit of crawler.crawl(concurrency)) {
    eachResults.set(unit.request.url, tests.testUnit(unit));
    allUnits.push(unit);
    spinner.text = `Crawled ${allUnits.length}`;
  }
  const allResults = tests.testUnits(allUnits);
  spinner.succeed('Finished Crawling');

  stdout.write(formatConsole(eachResults, allResults) + EOL);

  if (json.length) {
    await writeFileP(
      json,
      JSON.stringify({ each: eachResults, all: allResults }),
      'utf8'
    );
  }

  if (junit.length) {
    await writeFileP(junit, formatJUnit(eachResults, allResults), 'utf8');
  }

  if (
    hasFailure(allResults) ||
    Array.from(eachResults.values()).some(hasFailure)
  ) {
    throw new FailedAnalysisError('Testing reported an error.');
  }
};
