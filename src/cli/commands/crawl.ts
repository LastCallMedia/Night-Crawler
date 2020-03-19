import { FailedAnalysisError } from '../errors';
import ConsoleReporter from '../formatters/ConsoleReporter';
import JUnitReporter from '../formatters/JUnitReporter';
import JSONReporter from '../formatters/JSONReporter';
import { hasFailure } from '../util';
import Reporter from '../formatters/Reporter';
import TestContext from '../../testing/TestContext';

export type CrawlArgs = {
  context: TestContext;
  concurrency?: number;
  json?: string;
  junit?: string;
  silent?: boolean;
  stdout?: NodeJS.WritableStream & { columns: number };
};

function getReporters(argv: CrawlArgs): Reporter[] {
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
export const handler = async function(argv: CrawlArgs): Promise<void> {
  const { context, concurrency = 3 } = argv;
  let hasAnyFailure = false;

  const reporters: Reporter[] = getReporters(argv);
  await Promise.all(reporters.map(reporter => reporter.start()));

  for await (const [url, result] of context.crawl(concurrency)) {
    reporters.forEach(r => r.report(url, result));
    hasAnyFailure = hasAnyFailure || hasFailure(result);
  }

  await Promise.all(reporters.map(r => r.stop()));

  if (hasAnyFailure) {
    throw new FailedAnalysisError('Testing reported an error.');
  }
};
