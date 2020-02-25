import format, { formatMetrics, formatResults } from '../console';
import Analysis from '../../../analysis';
import Number from '../../../metrics/Number';

describe('Console Formatter', function() {
  describe('Results', function() {
    const a = new Analysis('test', new Date());
    a.addResult('OK', 0, 10, 'm1');
    a.addResult('WARN', 1, 10, 'm1');
    a.addResult('ERR', 2, 10, 'm1');

    it('Should output results in color if requested', function() {
      expect(
        formatResults(a.results, { color: true, minLevel: 0 })
      ).toMatchSnapshot();
    });
    it('Should output results without color if requested', function() {
      expect(
        formatResults(a.results, { color: false, minLevel: 0 })
      ).toMatchSnapshot();
    });
    it('Should filter out success results if verbosity is warning', function() {
      expect(
        formatResults(a.results, { color: false, minLevel: 1 })
      ).toMatchSnapshot();
    });
  });

  describe('Metrics', function() {
    const a = new Analysis('test', new Date());
    a.addMetric('ok', new Number('OK metric', 0, 0));
    a.addMetric('warn', new Number('WARN metric', 1, 2));
    a.addMetric('err', new Number('ERR metric', 2, 5));

    it('Should output metrics in color if requested', function() {
      expect(formatMetrics(a.metrics, { color: true })).toMatchSnapshot();
    });
    it('Should output metrics without color if requested', function() {
      expect(formatMetrics(a.metrics, { color: false })).toMatchSnapshot();
    });
    it('Should display all metrics, even when verbosity is limited to errors', function() {
      const output = formatMetrics(a.metrics, { color: false, minLevel: 2 });
      expect(output).toMatch('OK metric');
      expect(output).toMatch('ERR metric');
    });
  });

  describe('Format', function() {
    it('Should show output when there are no results or metrics', function() {
      expect(
        format(new Analysis(), { color: false, minLevel: 0 })
      ).toMatchSnapshot();
    });
    it('Should show output in color when there are no results or metrics and color is requested', function() {
      expect(
        format(new Analysis(), { color: true, minLevel: 0 })
      ).toMatchSnapshot();
    });
    it('Should show results and metrics when given an analysis containing results and metrics', function() {
      const a = new Analysis('test', new Date());
      a.addMetric('ok', new Number('OK Metric', 0, 0));
      a.addResult('OK Result', 0, 10, 'r1');
      const formatted = format(a, { color: false, minLevel: 0 });
      expect(formatted).toMatch('OK Metric');
      expect(formatted).toMatch('OK Result');
    });
  });
});
