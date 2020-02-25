import { consoleDisplayValue } from '../util';
import {table} from 'table';
import Analysis from '../../analysis';

type MaybeOptions = {
  minLevel?: number
  color?: boolean
}

type Options = {
  minLevel: number,
  color: boolean
};

const DefaultOptions = {
  color: true,
  minLevel: 0
};

export default function format(
  analysis: Analysis,
  options: MaybeOptions = DefaultOptions
) {
  const opts = Object.assign({}, DefaultOptions, options);
  const listing = formatResults(analysis.results, opts);
  const aggregate = formatMetrics(analysis.metrics, opts);

  return `Results\n======\n${listing}\n\nMetrics\n=======\n${aggregate}`;
}

function formatIcon(level: number) {
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

function formatValue(level: number, value: string, options: Options) {
  return options.color ? consoleDisplayValue(level, value) : value;
}

export function formatResults(
  results: Analysis['results'],
  options: MaybeOptions = DefaultOptions
) {
  const opts = Object.assign({}, DefaultOptions, options);
  const rows = buildResults(results, opts);
  if (rows.length) {
    return table([['', 'Url']].concat(rows));
  }
  return formatValue(1, 'No results to display', opts);
}
function buildResults(results: Analysis['results'], options: Options) {
  return results
    .filter(res => res.level >= options.minLevel)
    .map(res => [
      formatIcon(res.level),
      formatValue(res.level, res.url, options)
    ]);
}

export function formatMetrics(
  metrics: Analysis['metrics'],
  options: MaybeOptions = DefaultOptions
) {
  const opts = Object.assign({}, DefaultOptions, options);
  const rows = buildMetrics(metrics, opts);
  if (rows.length) {
    return table([['', 'Name', 'Value']].concat(rows));
  }
  return formatValue(1, 'No metrics to display', opts);
}

type MetricRow = [string, string, string]
function buildMetrics(metrics: Analysis['metrics'], options: Options): Array<MetricRow> {
  const rows: Array<MetricRow> = [];
  metrics.forEach((metric, name) => {
    rows.push([
      formatIcon(metric.level),
      metric.displayName,
      formatValue(metric.level, metric.toString(), options)
    ])
  })
  return rows
}
