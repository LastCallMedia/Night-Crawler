import Analysis from '../analysis';
import { Number } from '../metrics';

describe('Analysis', function() {
  it('Should collect metrics', function() {
    var n = new Number('Test', 0, 1);
    var a = new Analysis();
    a.addMetric('test', n);
    expect(a.metrics.size).toEqual(1);
    expect(a.metrics.get('test')).toEqual(n);
  });

  it('Should collect results', function() {
    var a = new Analysis();
    a.addResult('foo', 0, 1, 'test');
    expect(a.results).toEqual([
      {
        url: 'foo',
        level: 0,
        time: 1,
        message: 'test'
      }
    ]);
  });

  it('Should know if it has any failing results', function() {
    var a = new Analysis();
    expect(a.hasFailures()).toEqual(false);
    a.addResult('warn', 1, 1, 'test');
    expect(a.hasFailures()).toEqual(false);
    a.addResult('fail', 2, 1, 'test');
    expect(a.hasFailures()).toEqual(true);
  });

  it('Should know if it has any failing metrics', function() {
    var a = new Analysis();
    expect(a.hasFailures()).toEqual(false);
    a.addMetric('warn', new Number('Warn', 1, 0));
    expect(a.hasFailures()).toEqual(false);
    a.addMetric('fail', new Number('Fail', 2, 0));
    expect(a.hasFailures()).toEqual(true);
  });
});
