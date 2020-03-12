import { TestResultMap } from '../../testing/TestContext';
import { hasFailure } from '../util';
import chalk from 'chalk';
import wrap from 'wrap-ansi';
import indent from 'indent-string';
import Reporter from './Reporter';

type Options = { columns: number };
const defaults: Options = { columns: 60 };

function formatResult(
  url: string,
  result: TestResultMap,
  options: Partial<Options> = {}
): string {
  const opts: Options = { ...options, ...defaults };
  if (!hasFailure(result)) {
    return `${chalk.bgGreen('PASS')} ${url}\n`;
  }
  const detail = Array.from(result)
    .map(([description, result]) => {
      if (result.pass) {
        return indent(wrap(`* ${chalk.green(description)}`, opts.columns), 2);
      }
      return (
        indent(wrap(`* ${chalk.red(description)}`, opts.columns), 2) +
        '\n' +
        indent(wrap(result.message, opts.columns), 6)
      );
    })
    .join('\n');

  return `${chalk.bgRed('FAIL')} ${url}\n${detail}\n`;
}

type StdOut = NodeJS.WritableStream & { columns: number };

export default class ConsoleReporter implements Reporter {
  stdout: StdOut;
  constructor(stdout: NodeJS.WritableStream & { columns: number }) {
    this.stdout = stdout;
  }
  async start(): Promise<void> {
    this.stdout.write('Crawling...\n');
  }
  report(url: string, result: TestResultMap): void {
    this.stdout.write(
      formatResult(url, result, { columns: this.stdout.columns })
    );
  }
  async stop(): Promise<void> {
    this.stdout.write('Crawling complete.\n');
  }
}
