import ConsoleFormatter from '../console';
import Analysis from '../../../analysis';
import { Number } from '../../../metrics';

describe('Console Formatter', function() {
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
