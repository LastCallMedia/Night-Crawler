import { consoleDisplayValue } from '../util';
import { table } from 'table';
import Analysis from '../../analysis';

type MaybeOptions = {
  minLevel?: number;
  color?: boolean;
};

type Options = {
  minLevel: number;
  color: boolean;
};

const DefaultOptions = {
  color: true,
  minLevel: 0
};

function formatIcon(level: number): string {
  switch (level) {
    case 2:
      return '✖';
    case 1:
      return '!';
    case 0:
      return '✔';
    default:
      return ' ';
  }
}

function formatValue(level: number, value: string, options: Options): string {
  return options.color ? consoleDisplayValue(level, value) : value;
}

function buildResults(
  results: Analysis['results'],
  options: Options
): [string, string][] {
  return results
    .filter(res => res.level >= options.minLevel)
    .map(res => [
      formatIcon(res.level),
      formatValue(res.level, res.url, options)
    ]);
}

export function formatResults(
  results: Analysis['results'],
  options: MaybeOptions = DefaultOptions
): string {
  const opts = Object.assign({}, DefaultOptions, options);
  const rows = buildResults(results, opts);
  if (rows.length) {
    return table([['', 'Url']].concat(rows));
  }
  return formatValue(1, 'No results to display', opts);
}

function buildMetrics(
  metrics: Analysis['metrics'],
  options: Options
): Array<[string, string, string]> {
  return Array.from(metrics, ([, metric]) => {
    return [
      formatIcon(metric.level),
      metric.displayName,
      formatValue(metric.level, metric.toString(), options)
    ];
  });
}

export function formatMetrics(
  metrics: Analysis['metrics'],
  options: MaybeOptions = DefaultOptions
): string {
  const opts = Object.assign({}, DefaultOptions, options);
  const rows = buildMetrics(metrics, opts);
  if (rows.length) {
    return table([['', 'Name', 'Value']].concat(rows));
  }
  return formatValue(1, 'No metrics to display', opts);
}

export default function format(
  analysis: Analysis,
  options: MaybeOptions = DefaultOptions
): string {
  const opts = Object.assign({}, DefaultOptions, options);
  const listing = formatResults(analysis.results, opts);
  const aggregate = formatMetrics(analysis.metrics, opts);

  return `Results\n======\n${listing}\n\nMetrics\n=======\n${aggregate}`;
}
