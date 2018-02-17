import {
  ConsoleFormatter,
  JUnitFormatter,
  ConsoleComparisonFormatter
} from '../src/formatters';

import Analysis from '../src/analysis';
import { Number } from '../src/metrics';

describe('Console Formatter', function() {
  let originalCols;
  beforeEach(function() {
    originalCols = process.stdout.columns;
    process.stdout.columns = 100;
  });
  afterEach(function() {
    process.stdout.columns = originalCols;
  });
  it('Should output a listing of results marked according to level', function() {
    var a = new Analysis('test', new Date());
    a.addResult('OK', 0, 10, 'm1');
    a.addResult('WARN', 1, 10, 'm1');
    a.addResult('ERR', 2, 10, 'm1');
    expect(new ConsoleFormatter().format(a)).toMatchSnapshot();
  });
  it('Should output aggregates, marked by level', function() {
    var a = new Analysis('test', new Date());
    a.addMetric('ok', new Number('OK metric', 0, 0));
    a.addMetric('warn', new Number('WARN metric', 1, 2));
    a.addMetric('err', new Number('ERR metric', 2, 5));
    expect(new ConsoleFormatter().format(a)).toMatchSnapshot();
  });
  it('Should show no results when there are no results or metrics', function() {
    var a = new Analysis('test', new Date());
    expect(new ConsoleFormatter().format(a)).toMatchSnapshot();
  });
});

describe('JUnit formatter', function() {
  it('Should output a listing of results', function() {
    var a = new Analysis('test', new Date());
    a.addResult('OK', 0, 10, 'm1');
    a.addResult('WARN', 1, 10, 'm1');
    a.addResult('ERR', 2, 10, 'm1');
    expect(new JUnitFormatter().format(a)).toMatchSnapshot();
  });
  it('Should output aggregates, marked by level', function() {
    var a = new Analysis('test', new Date());
    a.addMetric('ok', new Number('OK metric', 0, 0));
    a.addMetric('warn', new Number('WARN metric', 1, 2));
    a.addMetric('err', new Number('ERR metric', 2, 5));
    expect(new JUnitFormatter().format(a)).toMatchSnapshot();
  });
});

describe('Console Comparison Formatter', function() {
  let originalCols;
  beforeEach(function() {
    originalCols = process.stdout.columns;
    process.stdout.columns = 100;
  });
  afterEach(function() {
    process.stdout.columns = originalCols;
  });
  it('Should compare metrics from two analyses', function() {
    var a = new Analysis('test', new Date());
    a.addMetric('ok', new Number('OK metric', 0, 0));
    a.addMetric('warn', new Number('WARN metric', 1, 2));
    a.addMetric('err', new Number('ERR metric', 2, 5));
    var b = new Analysis('test', new Date());
    b.addMetric('ok', new Number('OK metric', 0, 0));
    b.addMetric('warn', new Number('WARN metric', 1, 2));
    b.addMetric('err', new Number('ERR metric', 2, 5));
    expect(new ConsoleComparisonFormatter().format([a, b])).toMatchSnapshot();
  });
  it('Should output "no results" if a report has no metrics', function() {
    var a = new Analysis('test', new Date());
    var b = new Analysis('test2', new Date());
    expect(new ConsoleComparisonFormatter().format([a, b])).toMatchSnapshot();
  });
});
