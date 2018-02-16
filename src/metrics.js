// @flow

export interface Metric {
  displayName: string;
  level: number;
  value: number;
  toString(): string;
}

class AbstractMetric {
  displayName: string;
  level: number;
  value: number;
  constructor(label: string, level: number, value: number) {
    this.displayName = label;
    this.level = level;
    this.value = value;
  }
}

export class Percent extends AbstractMetric implements Metric {
  toString() {
    return `${Math.round(this.value * 100)}%`;
  }
}

export class Milliseconds extends AbstractMetric implements Metric {
  toString() {
    return `${Math.round(this.value)}ms`;
  }
}
