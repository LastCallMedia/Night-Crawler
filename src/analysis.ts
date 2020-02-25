export type AnalyzedResult = {
  url: string;
  level: number;
  time: number;
  message: string;
};

export interface Metric {
  displayName: string;
  level: number;
  value: number;
  toString(): string;
}

export default class Analysis {
  label: string;
  date: Date;
  metrics: Map<string, Metric>;
  results: Array<AnalyzedResult>;

  constructor(label?: string, date?: Date) {
    this.label = label ?? 'default';
    this.date = date ?? new Date();
    this.metrics = new Map();
    this.results = [];
  }

  /**
   * Add a single metric to the analysis.
   *
   * @param key
   * @param metric
   */
  addMetric(key: string, metric: Metric): this {
    this.metrics.set(key, metric);
    return this;
  }

  /**
   * Add a single URL result to the analysis.
   *
   * @param url
   * @param level
   * @param time
   * @param message
   */
  addResult(url: string, level: number, time: number, message: string): this {
    this.results.push({
      url,
      level: level || 0,
      time: time || 0,
      message: message || 'Ok'
    });
    return this;
  }

  /**
   * Check whether this analysis contains any failing results.
   *
   * @return {boolean}
   */
  hasFailures(): boolean {
    const failingResults = this.results.filter(r => r.level > 1);
    const failingMetrics = Array.from(this.metrics).filter(
      ([, metric]) => metric.level > 1
    );
    return failingResults.length > 0 || failingMetrics.length > 0;
  }
}
