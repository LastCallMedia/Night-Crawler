import { pickFailures } from '../util';
import { table } from 'table';
import { TestResult, EachResults } from '../../testing/TestContext';
import { hasFailure } from '../util';
import chalk from 'chalk';

function formatValue(ok: boolean, value: string): string {
  return ok ? chalk.red(value) : chalk.green(value);
}

function formatStatus(ok: boolean): string {
  return ok ? formatValue(true, '✔') : formatValue(false, '✖');
}

function buildEachResults(results: EachResults): [string, string, string][] {
  return Array.from(results.entries()).map(([url, result]) => {
    const hasFailures = hasFailure(result);
    return [
      formatStatus(hasFailures),
      formatValue(hasFailures, url),
      formatValue(
        hasFailures,
        Array.from(pickFailures(result).keys())
          .map(d => `- ${d}`)
          .join('\n')
      )
    ];
  });
}

export function formatEachResults(results: EachResults): string {
  const rows = buildEachResults(results);
  if (rows.length) {
    return table([['', 'Url', 'Errors']].concat(rows));
  }
  return formatValue(true, 'No results to display');
}

function buildAllResults(results: TestResult): Array<[string, string]> {
  return Array.from(results, ([description, result]) => {
    return [formatStatus(result), formatValue(result, description)];
  });
}

export function formatAllResults(metrics: TestResult): string {
  const rows = buildAllResults(metrics);
  if (rows.length) {
    return table([['', 'Name']].concat(rows));
  }
  return formatValue(true, 'No results to display');
}

export default function format(
  eachResults: EachResults,
  allResults: TestResult
): string {
  const each = formatEachResults(eachResults);
  const all = formatAllResults(allResults);

  return `URL Results:\n======\n${each}\n\nAll Requests:\n=======\n${all}`;
}
