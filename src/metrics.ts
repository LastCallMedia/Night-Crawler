// @flow

export interface Metric {
  displayName: string;
  level: number;
  value: number;
  toString(): string;
}

export class Number implements Metric {
  displayName: string;
  level: number;
  value: number;
  constructor(label: string, level: number, value: number) {
    this.displayName = label;
    this.level = level;
    this.value = value;
  }
  toString() {
    return `${this.value}`;
  }
}

export class Percent extends Number {
  toString() {
    return `${Math.round(this.value * 100)}%`;
  }
}

export class Milliseconds extends Number {
  toString() {
    return `${Math.round(this.value)}ms`;
  }
}
