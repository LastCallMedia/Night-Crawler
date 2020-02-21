import { consoleDisplayValue } from '../util';
import {table} from 'table';
import Analysis from '../../analysis';

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
  options: Options = DefaultOptions
) {
  const listing = formatResults(analysis.results, options);
  const aggregate = formatMetrics(analysis.metrics, options);

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
  options: Options = DefaultOptions
) {
  const rows = buildResults(results, options);
  if (rows.length) {
    return table([['', 'Url']].concat(rows));
  }
  return formatValue(1, 'No results to display', options);
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
  options: Options = DefaultOptions
) {
  const rows = buildMetrics(metrics, options);
  if (rows.length) {
    return table([['', 'Name', 'Value']].concat(rows));
  }
  return formatValue(1, 'No metrics to display', options);
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
