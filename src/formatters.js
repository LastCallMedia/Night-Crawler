// @flow

import JUnitFactory from 'junit-report-builder/src/factory';
import chalk from 'chalk';
import Table from 'tty-table';
import { Percent } from './metrics';
import type Analysis, { AnalyzedResult } from './analysis';
import type { Metric } from './metrics';
import type JUnitBuilder from 'junit-report-builder/src/builder';

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

    return `Results\n======\n${listing}\n\nMetrics\n=======\n${aggregate}`;
  }
  buildAggregate(analysis: Analysis): string {
    const rows = this.buildAggregateRows(analysis);
    if (rows.length) {
      return new Table([], rows).render();
    }
    return chalk.yellow('No Results');
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
    if (analysis.results.length) {
      return analysis.results
        .map(res => {
          return consoleDisplayValue(res.level, res.url);
        })
        .join('\n');
    }
    return chalk.yellow('No Results');
  }
}

export class JUnitFormatter implements Formatter {
  format(report: Analysis): string {
    var builder = new JUnitFactory().newBuilder();

    if (report.metrics.size) {
      this.buildAggregates(report.metrics, builder);
    }
    if (report.results.length) {
      this.buildResults(report.results, builder);
    }

    return builder.build();
  }
  buildAggregates(metrics: Map<string, Metric>, builder: JUnitBuilder) {
    const suite = builder.testSuite().name(`Aggregates`);
    metrics.forEach((metric, name) => {
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
  }
  buildResults(results: Array<AnalyzedResult>, builder: JUnitBuilder) {
    const suite = builder.testSuite().name(`Results`);
    results.forEach(res => {
      let tc = suite
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
  }
}

export class ConsoleComparisonFormatter implements ComparisonFormatter {
  format(reports: Array<Analysis>): string {
    const rows = this.buildRows(reports);
    if (rows.length) {
      return new Table(this.buildHeader(reports), rows).render();
    }
    return chalk.yellow('No Results');
  }
  buildHeader(reports: Array<Analysis>) {
    const reportHeaders = reports.map((report, i) => {
      return { alias: `#${i + 1}` };
    });
    return [{ alias: 'Metric' }].concat(reportHeaders);
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
