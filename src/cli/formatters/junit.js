// @flow

import JUnitFactory from 'junit-report-builder/src/factory';
import type Analysis from '../../analysis';
import type JUnitBuilder from 'junit-report-builder/src/builder';

type Options = {
  filename?: string
};

type Metrics = $PropertyType<Analysis, 'metrics'>;
type Results = $PropertyType<Analysis, 'results'>;

export default function formatJUnit(analysis: Analysis, options: Options = {}) {
  var builder = new JUnitFactory().newBuilder();

  buildMetrics(analysis.metrics, builder);

  buildResults(analysis.results, builder);

  if (options.filename) {
    builder.writeTo(options.filename);
  } else {
    return builder.build();
  }
}

function buildResults(results: Results, builder: JUnitBuilder) {
  if (results.length) {
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

function buildMetrics(metrics: Metrics, builder: JUnitBuilder) {
  if (metrics.size) {
    const suite = builder.testSuite().name(`Aggregates`);
    metrics.forEach((metric, name) => {
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
}
