import JUnitFormatter from '../junit';
import Analysis from '../../../analysis';
import { Number } from '../../../metrics';

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
