// @flow

import type { Metric } from './metrics';

export type AnalyzedResult = {
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

  /**
   * Add a single metric to the analysis.
   *
   * @param key
   * @param metric
   */
  addMetric(key: string, metric: Metric) {
    this.metrics.set(key, metric);
  }

  /**
   * Add a single URL result to the analysis.
   *
   * @param url
   * @param level
   * @param time
   * @param message
   */
  addResult(url: string, level: number, time: number, message: string) {
    this.results.push({
      url,
      level: level || 0,
      time: time || 0,
      message: message || 'Ok'
    });
  }

  /**
   * Check whether this analysis contains any failing results.
   *
   * @return {boolean}
   */
  hasFailures(): boolean {
    var failingResults = this.results.filter(r => r.level > 1);
    var failingMetrics = Array.from(this.metrics).filter(
      ([name, metric]) => metric.level > 1
    );
    return failingResults.length > 0 || failingMetrics.length > 0;
  }
}
