// @flow

import JUnitFactory from 'junit-report-builder/src/factory';
import type Formatter from './types';
import type Analysis from '../../analysis';
import type JUnitBuilder from 'junit-report-builder/src/builder';

export default class JUnitFormatter implements Formatter {
  filename: string | null;
  constructor(filename: string | null) {
    this.filename = filename;
  }
  format(report: Analysis): ?string {
    var builder = new JUnitFactory().newBuilder();

    if (report.metrics.size) {
      this.buildAggregates(report, builder);
    }
    if (report.results.length) {
      this.buildResults(report, builder);
    }

    if (this.filename) {
      builder.writeTo(this.filename);
    } else {
      return builder.build();
    }
  }
  buildAggregates(analysis: Analysis, builder: JUnitBuilder) {
    const suite = builder.testSuite().name(`Aggregates`);
    analysis.metrics.forEach((metric, name) => {
      let tc = suite
        .testCase()
        .className(name)
        .name(metric.displayName)
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
  buildResults(analysis: Analysis, builder: JUnitBuilder) {
    const suite = builder.testSuite().name(`Results`);
    analysis.results.forEach(res => {
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
