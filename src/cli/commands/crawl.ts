import { FailedAnalysisError } from '../errors';
import ConsoleReporter from '../formatters/ConsoleReporter';
import JUnitReporter from '../formatters/JUnitReporter';
import JSONReporter from '../formatters/JSONReporter';
import { BuilderCallback } from 'yargs';
import { ConfigArgs } from '../index';
import { hasFailure } from '../util';
import Reporter from '../formatters/Reporter';

export interface CrawlCommandArgs extends ConfigArgs {
  concurrency?: number;
  silent?: boolean;
  json?: string;
  junit?: string;
  stdout?: NodeJS.WritableStream & { columns: number };
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

function getReporters(argv: CrawlCommandArgs): Reporter[] {
  const reporters = [];
  if (!argv.silent) {
    reporters.push(new ConsoleReporter(argv.stdout ?? process.stdout));
  }
  if (argv.junit?.length) {
    reporters.push(new JUnitReporter(argv.junit));
  }
  if (argv.json?.length) {
    reporters.push(new JSONReporter(argv.json));
  }
  return reporters;
}
export const handler = async function(argv: CrawlCommandArgs): Promise<void> {
  const { crawler, tests, concurrency = 3 } = argv;

  const reporters: Reporter[] = getReporters(argv);
  await Promise.all(reporters.map(reporter => reporter.start()));

  let hasError = false;
  const allUnits = [];
  for await (const unit of crawler.crawl(concurrency)) {
    const result = tests.testUnit(unit);
    reporters.forEach(r => r.report(unit.request.url, result));
    hasError = hasError || hasFailure(result);
    allUnits.push(unit);
  }
  const allResults = tests.testUnits(allUnits);
  await Promise.all(
    reporters.map(reporter => {
      if (allResults.size > 0) {
        reporter.report('All Requests', allResults);
      }
      return reporter.stop();
    })
  );

  if (hasFailure(allResults) || hasError) {
    throw new FailedAnalysisError('Testing reported an error.');
  }
};
