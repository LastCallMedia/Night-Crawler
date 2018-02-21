import Analysis from '../analysis';
import { Number } from '../metrics';

describe('Analysis', function() {
  var a;
  beforeEach(function() {
    a = new Analysis('Test', new Date());
  });
  it('Should collect metrics', function() {
    var n = new Number('Test', 0, 1);
    a.addMetric('test', n);
    expect(a.metrics.size).toEqual(1);
    expect(a.metrics.get('test')).toEqual(n);
  });

  it('Should collect results', function() {
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

  it('Should have a name', function() {
    expect(a.label).toBe('Test');
  });
  it('Should have a date', function() {
    expect(a.date).toBeInstanceOf(Date);
  });

  describe('hasFailures', function() {
    it('Should not have failures on an empty analysis', function() {
      expect(a.hasFailures()).toEqual(false);
    });
    it('Should not have failures on a warning result', function() {
      a.addResult('warn', 1, 1, 'test');
      expect(a.hasFailures()).toEqual(false);
    });
    it('Should have failures on a failure result', function() {
      a.addResult('err', 2, 1, 'test');
      expect(a.hasFailures()).toEqual(true);
    });
    it('Should not have failures on a warning metric', function() {
      a.addMetric('warn', new Number('Warn', 1, 0));
      expect(a.hasFailures()).toEqual(false);
    });
    it('Should have failures on a failing metric', function() {
      a.addMetric('fail', new Number('Fail', 2, 0));
      expect(a.hasFailures()).toEqual(true);
    });
  });
});
