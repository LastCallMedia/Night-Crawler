// @flow

import { consoleDisplayValue } from '../util';
import Table from 'tty-table';
import type Formatter from './types';
import type Analysis from '../../analysis';

export default class ConsoleFormatter implements Formatter {
  format(analysis: Analysis): string {
    const listing = this.buildResults(analysis);
    const aggregate = this.buildAggregate(analysis);

    return `Results\n======\n${listing}\n\nMetrics\n=======\n${aggregate}`;
  }
  buildAggregate(analysis: Analysis): string {
    const rows = this.buildAggregateRows(analysis);
    if (rows.length) {
      return new Table([], rows, { headerColor: false }).render();
    }
    return consoleDisplayValue(1, 'No Results');
  }
  buildAggregateRows(report: Analysis) {
    return Array.from(report.metrics).map(([name, metric]) => {
      return [
        metric.displayName,
        consoleDisplayValue(metric.level, metric.toString())
      ];
    });
  }
  buildResults(analysis: Analysis): string {
    if (analysis.results.length) {
      return analysis.results
        .map(res => {
          return consoleDisplayValue(res.level, res.url);
        })
        .join('\n');
    }
    return consoleDisplayValue(1, 'No Results');
  }
}
