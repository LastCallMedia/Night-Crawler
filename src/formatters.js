// @flow

import junit from 'junit-report-builder';
import chalk from 'chalk';
import Table from 'tty-table';
import { Percent } from './metrics';
import type Analysis from './analysis';
import type { Metric } from './metrics';

export interface Formatter {
  format(report: Analysis): string;
}

export interface ComparisonFormatter {
  format(reports: Array<Analysis>): string;
}

function consoleDisplayValue(metric: Metric) {
  switch (metric.level) {
    case 2:
      return chalk.red(metric.toString());
    case 1:
      return chalk.yellow(metric.toString());
    default:
      return metric.toString();
  }
}

function consoleComparisonValue(baseline: Metric, metric: Metric | void) {
  if (!metric) {
    return 'N/A';
  }
  const diff = calculateDiff(baseline, metric);
  return `${consoleDisplayValue(metric)} (${consoleDisplayValue(diff)})`;
}

function calculateDiff(baseline: Metric, comparison: Metric): Metric {
  return new Percent('Comparison', 0, comparison.value / baseline.value);
}

export class ConsoleFormatter implements Formatter {
  format(report: Analysis): string {
    const table = new Table([], this.buildRows(report));
    return table.render();
  }
  buildRows(report: Analysis) {
    return Array.from(report.metrics).map(([name, metric]) => {
      return [metric.displayName, consoleDisplayValue(metric)];
    });
  }
}

export class JunitFormatter implements Formatter {
  format(report: Analysis): string {
    const suite = junit.testSuite().name(report.label);
    report.metrics.forEach((metric, name) => {
      let tc = suite
        .testCase()
        .className(name)
        .name(metric.displayName || name)
        .standardOutput(metric.toString());
      switch (metric.level) {
        case 2:
          tc.failure();
          break;
        case 1:
          tc.error();
          break;
      }
    });
    return junit.build();
  }
}

export class ConsoleComparisonFormatter implements ComparisonFormatter {
  format(reports: Array<Analysis>): string {
    const table = new Table([], this.buildRows(reports), {});
    return table.render();
  }
  buildRows(reports: Array<Analysis>) {
    const baseline = reports[0];
    const rest = reports.slice(1);

    return Array.from(baseline.metrics).map(([name, baselineMetric]) => {
      let comparisonMetrics = rest.map(r => r.metrics.get(name));

      let row = [baselineMetric.displayName];
      row.push(consoleDisplayValue(baselineMetric));
      return row.concat(
        comparisonMetrics.map(metric =>
          consoleComparisonValue(baselineMetric, metric)
        )
      );
    });
  }
}
