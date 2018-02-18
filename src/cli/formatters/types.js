import type Analysis from '../../analysis';

export interface Formatter {
  format(report: Analysis): string;
}

export interface ComparisonFormatter {
  format(reports: Array<Analysis>): string;
}
