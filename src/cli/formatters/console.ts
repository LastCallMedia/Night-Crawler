import { pickFailures } from '../util';
import { table } from 'table';
import { TestResultMap, EachResultMap } from '../../testing/TestContext';
import { hasFailure } from '../util';
import chalk from 'chalk';

function formatValue(ok: boolean, value: string): string {
  return ok ? chalk.green(value) : chalk.red(value);
}

function formatStatus(ok: boolean): string {
  return formatValue(ok, ok ? '✔' : '✖');
}

function buildEachResults(results: EachResultMap): [string, string, string][] {
  return Array.from(results.entries()).map(([url, result]) => {
    const pass = !hasFailure(result);
    return [
      formatStatus(pass),
      formatValue(pass, url),
      formatValue(
        pass,
        Array.from(pickFailures(result).keys())
          .map(d => `- ${d}`)
          .join('\n')
      )
    ];
  });
}

export function formatEachResults(results: EachResultMap): string {
  const rows = buildEachResults(results);
  if (rows.length) {
    return table([['', 'Url', 'Errors']].concat(rows));
  }
  return formatValue(true, 'No results to display');
}

function buildAllResults(results: TestResultMap): Array<[string, string]> {
  return Array.from(results, ([description, result]) => {
    return [formatStatus(result.pass), formatValue(result.pass, description)];
  });
}

export function formatAllResults(metrics: TestResultMap): string {
  const rows = buildAllResults(metrics);
  if (rows.length) {
    return table([['', 'Name']].concat(rows));
  }
  return formatValue(true, 'No results to display');
}

export default function format(
  eachResults: EachResultMap,
  allResults: TestResultMap
): string {
  const each = formatEachResults(eachResults);
  const all = formatAllResults(allResults);

  return `URL Results:\n======\n${each}\n\nAll Requests:\n=======\n${all}`;
}
