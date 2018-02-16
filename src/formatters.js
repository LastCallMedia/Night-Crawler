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

function consoleDisplayValue(level: number, value: string) {
  switch (level) {
    case 2:
      return chalk.red(value);
    case 1:
      return chalk.yellow(value);
    default:
      return value;
  }
}

function consoleComparisonValue(baseline: Metric, metric: Metric | void) {
  if (!metric) {
    return 'N/A';
  }

  const diffMetric = calculateDiff(baseline, metric);
  const value = consoleDisplayValue(metric.level, metric.toString());
  const diff = consoleDisplayValue(diffMetric.level, diffMetric.toString());

  return `${value} (${diff})`;
}

function calculateDiff(baseline: Metric, comparison: Metric): Metric {
  var diff = baseline.value > 0 ? comparison.value / baseline.value : 0;
  return new Percent('Comparison', 0, diff);
}

export class ConsoleFormatter implements Formatter {
  format(analysis: Analysis): string {
    const listing = this.buildResults(analysis);
    const aggregate = this.buildAggregate(analysis);

    return `${listing}\n${aggregate}`;
  }
  buildAggregate(analysis: Analysis): string {
    return new Table([], this.buildAggregateRows(analysis)).render();
  }
  buildAggregateRows(report: Analysis) {
    return Array.from(report.metrics).map(([name, metric]) => {
      return [
        metric.displayName,
        consoleDisplayValue(metric.level, metric.toString())
      ];
    });
  }
  buildResults(analysis: Analysis): string {
    return analysis.results
      .map(res => {
        return consoleDisplayValue(res.level, res.url);
      })
      .join('\n');
  }
}

export class JunitFormatter implements Formatter {
  format(report: Analysis): string {
    const aggregateSuite = junit.testSuite().name(`${report.label} Aggregates`);
    report.metrics.forEach((metric, name) => {
      let tc = aggregateSuite
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
    const urlSuite = junit.testSuite().name(`${report.label} Urls`);
    report.results.forEach(res => {
      let tc = urlSuite
        .testCase()
        .className(res.url)
        .time(res.time / 1000);
      switch (res.level) {
        case 2:
          tc.failure(res.message);
          break;
        case 1:
          tc.error(res.message);
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
      row.push(
        consoleDisplayValue(baselineMetric.level, baselineMetric.toString())
      );
      return row.concat(
        comparisonMetrics.map(metric =>
          consoleComparisonValue(baselineMetric, metric)
        )
      );
    });
  }
}
