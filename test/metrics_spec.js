const metrics = require('../src/metrics');

describe('Metrics', function() {
  describe('PercentTrue', function() {
    it('Should set the displayName', function() {
      var m = new metrics.PercentTrue('foo');
      expect(m.displayName).toEqual('foo');
    });
    it('Should not fail with no points', function() {
      var m = new metrics.PercentTrue('test');
      expect(m.valueOf()).toEqual(0);
    });
    it('Should calculate the average truth of an array of boolean values', function() {
      var m = new metrics.PercentTrue('test', [true, false]);
      expect(m.valueOf()).toEqual(50);
    });

    it('Should format the value', function() {
      var m = new metrics.PercentTrue('test', [true, false]);
      expect(m.toString()).toEqual('50%');
    });

    it('Should not report an error or warning by default', function() {
      var m = new metrics.PercentTrue('', []);
      expect(m.isError()).toEqual(false);
      expect(m.isWarning()).toEqual(false);
    });

    it('Should report an error if the errorCheck callback returns true', function() {
      var cb = jest.fn(() => true);
      var m = new metrics.PercentTrue('', [true]);
      m.errorCheck = cb;
      expect(m.isError()).toEqual(true);
      expect(cb.mock.calls).toEqual([[100]]);
    });

    it('Should report a warning if the warningCheck callback returns true', function() {
      var cb = jest.fn(() => true);
      var m = new metrics.PercentTrue('', [true]);
      m.warningCheck = cb;
      expect(m.isWarning()).toEqual(true);
      expect(cb.mock.calls).toEqual([[100]]);
    });

    it('Should calculate a diff of another metric of the same type', function() {
      var base = new metrics.PercentTrue('', [true]);
      var comparo = new metrics.PercentTrue('', [false]);
      expect(base.diff(comparo)).toEqual('-100%');
    });
  });

  describe('AverageNumber', function() {
    it('Should set the displayName', function() {
      var m = new metrics.AverageNumber('foo');
      expect(m.displayName).toEqual('foo');
    });
    it('Should not fail with no points', function() {
      var m = new metrics.AverageNumber();
      expect(m.valueOf()).toEqual(0);
    });
    it('Should calculate the average of an array of boolean values', function() {
      var m = new metrics.AverageNumber('', [1, 3]);
      expect(m.valueOf()).toEqual(2);
    });
    it('Should format the value', function() {
      var m = new metrics.AverageNumber('', [1, 3]);
      expect(m.toString()).toEqual('2ms');
    });
    it('Should report an error if the errorCheck callback returns true', function() {
      var cb = jest.fn(() => true);
      var m = new metrics.AverageNumber('', [1]);
      m.errorCheck = cb;
      expect(m.isError()).toEqual(true);
      expect(cb.mock.calls).toEqual([[1]]);
    });
    it('Should report a warning if the warningCheck callback returns true', function() {
      var cb = jest.fn(() => true);
      var m = new metrics.AverageNumber('', [1]);
      m.warningCheck = cb;
      expect(m.isWarning()).toEqual(true);
      expect(cb.mock.calls).toEqual([[1]]);
    });
    it('Should calculate a diff of another metric of the same type', function() {
      var base = new metrics.AverageNumber('', [3]);
      var comparo = new metrics.AverageNumber('', [2]);
      expect(base.diff(comparo)).toEqual('-33%');
    });
  });
});
