import { Metric } from '../analysis';

export default class Number implements Metric {
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
