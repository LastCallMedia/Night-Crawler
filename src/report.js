const Table = require('tty-table');
var junit = require('junit-report-builder');

class Formatter {
  constructor(report) {
    this._report = report;
  }
  report() {}
}

class ConsoleFormatter extends Formatter {
  report() {
    var table = new Table([], this.buildRows());
    return table.render();
  }
  buildRows() {
    return Object.values(this._report.metrics).map(metric => {
      return [metric.displayName || metric.name, this.buildValue(metric)];
    });
  }
  buildValue(metric) {
    switch (metric.getLevel()) {
      case 2:
        return chalk.red(metric.toString());
      case 1:
        return chalk.yellow(metric.toString());
      default:
        return metric.toString();
    }
  }
}

class JunitFormatter extends Formatter {
  report() {
    var suite = junit.testSuite().name('Test');
    Object.keys(this._report.metrics).forEach(name => {
      var metric = this._report.metrics[name];
      var tc = suite
        .testCase()
        .className(name)
        .name(metric.displayName || metric.name)
        .standardOutput(metric.toString());
      switch (metric.getLevel()) {
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

class ComparisonFormatter {
  constructor(reports) {
    this._reports = reports;
  }
  report() {}
}

class ConsoleComparisonFormatter extends ComparisonFormatter {
  report() {
    var table = new Table([], this.buildRows(), {});
    return table.render();
  }
  buildRows() {
    var baseline = this._reports[0];
    var rest = this._reports.slice(1);

    return Object.keys(baseline.metrics).map(n => {
      var metric = baseline.metrics[n];
      // @todo: Handle a case where a report doesn't include a metric?
      var comparisonMetrics = rest
        .filter(r => r.metrics[n])
        .map(r => r.metrics[n]);

      var row = [metric.displayName || metric.name];
      row.push(this.buildValue(metric));

      return row.concat(
        comparisonMetrics.map(m => this.buildComparisonValue(m, metric))
      );
    });
  }
  buildValue(metric) {
    switch (metric.getLevel()) {
      case 2:
        return chalk.red(metric.toString());
      case 1:
        return chalk.yellow(metric.toString());
      default:
        return metric.toString();
    }
  }
  buildComparisonValue(metric, baseline) {
    var value = this.buildValue(metric);
    var diff = baseline.diff(metric);
    return `${value} (${diff})`;
  }
}

class Report {
  constructor(label) {
    this.label = label;
    this.metrics = [];
  }
  add(key, metric) {
    this.metrics[key] = metric;
  }
}

module.exports = {
  Report,
  ConsoleFormatter,
  JunitFormatter,
  ConsoleComparisonFormatter
};
