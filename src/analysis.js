// @flow

import type { Metric } from './metrics';

type AnalyzedFailure = {
  url: string,
  level: number,
  reason: string
};

export default class Analysis {
  label: string;
  date: Date;
  metrics: Map<string, Metric>;
  results: Array<AnalyzedFailure>;

  constructor(label: string, date: Date) {
    this.label = label;
    this.date = date;
    this.metrics = new Map();
    this.results = [];
  }
  addMetric(key: string, metric: Metric) {
    this.metrics.set(key, metric);
  }
  addResult(url: string, level: number, reason: string) {
    this.results.push({ url, level, reason });
  }
}
