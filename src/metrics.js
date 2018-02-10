class Metric {
  constructor(label) {
    this.displayName = label;
    this.warningCheck = function(v) {};
    this.errorCheck = function(v) {};
  }
  diff(metric) {
    var pctVal = (metric.valueOf() / this.valueOf() - 1) * 100;
    var sign = pctVal < 0 ? '-' : '+';
    return `${sign}${Math.round(Math.abs(pctVal))}%`;
  }
  getLevel() {
    if (this.isError()) {
      return 2;
    }
    if (this.isWarning()) {
      return 1;
    }
    return 0;
  }
  isWarning() {
    return !!this.warningCheck(this.valueOf());
  }
  isError() {
    return !!this.errorCheck(this.valueOf());
  }
}

class AverageNumber extends Metric {
  constructor(label, points) {
    super(label);
    this.points = points || [];
  }
  valueOf() {
    return this.points.length
      ? this.points.reduce((sum, p) => sum + p, 0) / this.points.length
      : 0;
  }
  toString() {
    return `${Math.round(this)}`;
  }
}

class AverageMilliseconds extends AverageNumber {
    toString() {
        return `${Math.round(this)}ms`;
    }
}

class PercentTrue extends Metric {
  constructor(label, points) {
    super(label);
    this.points = points || [];
  }
  valueOf() {
    return this.points.length
      ? this.points.filter(p => p).length / this.points.length * 100
      : 0;
  }
  toString() {
    return `${Math.round(this)}%`;
  }
}

module.exports = {
  Metric,
  AverageNumber,
  AverageMilliseconds,
  PercentTrue
};
