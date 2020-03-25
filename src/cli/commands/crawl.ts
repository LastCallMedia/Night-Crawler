import { FailedAnalysisError } from '../errors';
import ConsoleReporter from '../formatters/ConsoleReporter';
import JUnitReporter from '../formatters/JUnitReporter';
import JSONReporter from '../formatters/JSONReporter';
import { hasFailure } from '../util';
import Reporter from '../formatters/Reporter';
import TestContext from '../../testing/TestContext';
import { StdoutShape } from '../index';

type CommandArgv = {
  concurrency?: number;
  silent?: boolean;
  json?: string;
  junit?: string;
  context: TestContext;
};

function getReporters(argv: CommandArgv, stdout: StdoutShape): Reporter[] {
  const reporters = [];
  if (!argv.silent) {
    reporters.push(new ConsoleReporter(stdout));
  }
  if (argv.junit?.length) {
    reporters.push(new JUnitReporter(argv.junit));
  }
  if (argv.json?.length) {
    reporters.push(new JSONReporter(argv.json));
  }
  return reporters;
}

export default async function(
  argv: CommandArgv,
  stdout: StdoutShape
): Promise<void> {
  const { context, concurrency = 5 } = argv;
  const reporters: Reporter[] = getReporters(argv, stdout);

  let hasAnyFailure = false;

  await Promise.all(reporters.map(reporter => reporter.start()));

  for await (const [url, result] of context.crawl(concurrency)) {
    reporters.forEach(r => r.report(url, result));
    hasAnyFailure = hasAnyFailure || hasFailure(result);
  }

  await Promise.all(reporters.map(r => r.stop()));

  if (hasAnyFailure) {
    throw new FailedAnalysisError('Testing reported an error.');
  }
}
