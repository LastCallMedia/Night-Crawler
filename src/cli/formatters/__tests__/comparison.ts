import ConsoleComparisonFormatter from '../comparison';
import Analysis from '../../../analysis';
import Number from '../../../metrics/Number';

describe('Console Comparison Formatter', function() {
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
