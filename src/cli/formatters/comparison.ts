import { table } from 'table';
import { consoleDisplayValue } from '../util';
import { ComparisonFormatter } from './types';
import Analysis, { Metric } from '../../analysis';

function calculateDiff(baseline: number, comparison: number): string {
  const amount = baseline > 0 ? comparison / baseline : 0;
  return `${amount * 100}%`;
}
function consoleComparisonValue(
  baseline: Metric,
  metric: Metric | void
): string {
  if (!metric) {
    return 'N/A';
  }

  const diff = calculateDiff(baseline.value, metric.value);
  const value = consoleDisplayValue(metric.level, metric.toString());

  return `${value} (${diff})`;
}

export default class ConsoleComparisonFormatter implements ComparisonFormatter {
  format(reports: Array<Analysis>): string {
    const rows = this.buildRows(reports);
    if (rows.length) {
      return table([this.buildHeader(reports)].concat(rows));
    }
    return consoleDisplayValue(1, 'No Results');
  }
  buildHeader(reports: Array<Analysis>): string[] {
    const reportHeaders = reports.map((report, i): string => {
      return `Report #${i + 1}`;
    });
    return ['Name'].concat(reportHeaders);
  }
  buildRows(reports: Array<Analysis>): string[][] {
    const baseline = reports[0];
    const rest = reports.slice(1);

    return Array.from(baseline.metrics).map(([name, baselineMetric]) => {
      const comparisonMetrics = rest.map(r => r.metrics.get(name));

      return [
        baselineMetric.displayName,
        consoleDisplayValue(baselineMetric.level, baselineMetric.toString())
      ].concat(
        comparisonMetrics.map(metric =>
          consoleComparisonValue(baselineMetric, metric)
        )
      );
    });
  }
}
