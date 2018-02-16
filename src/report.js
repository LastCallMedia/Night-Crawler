// @flow

import type { Metric } from './metrics';

export class Report {
  label: string;
  date: Date;
  metrics: Map<string, Metric>;

  constructor(label: string, date: Date) {
    this.label = label;
    this.date = date;
    this.metrics = new Map();
    this.metrics = new Map();
  }
  add(key: string, metric: Metric) {
    this.metrics.set(key, metric);
  }
}
