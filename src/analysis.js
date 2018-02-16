// @flow

import type { Metric } from './metrics';

type AnalyzedResult = {
  url: string,
  level: number,
  time: number,
  message: string
};

export default class Analysis {
  label: string;
  date: Date;
  metrics: Map<string, Metric>;
  results: Array<AnalyzedResult>;

  constructor(label: string, date: Date) {
    this.label = label;
    this.date = date;
    this.metrics = new Map();
    this.results = [];
  }
  addMetric(key: string, metric: Metric) {
    this.metrics.set(key, metric);
  }
  addResult(url: string, level: number, time: number, message: string) {
    this.results.push({
      url,
      level: level || 0,
      time: time || 0,
      message: message || 'Ok'
    });
  }
}
