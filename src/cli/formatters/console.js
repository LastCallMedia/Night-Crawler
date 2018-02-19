// @flow

import { consoleDisplayValue, stringLength } from '../util';
import table from 'markdown-table';
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
      return table([['Name', 'Value']].concat(rows), { stringLength });
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
    const rows = this.buildResultRows(analysis);
    if (rows.length) {
      return table([['Url']].concat(rows), { stringLength });
    }
    return consoleDisplayValue(1, 'No Results');
  }
  buildResultRows(analysis: Analysis) {
    return analysis.results.map(res => [
      consoleDisplayValue(res.level, res.url)
    ]);
  }
}
