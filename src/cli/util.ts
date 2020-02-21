// @flow
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import Crawler from '../crawler';
import strip from 'strip-ansi';

export function requireCrawler(file: string | Crawler): Crawler {
  if (typeof file === 'string') {
    var resolved = path.resolve(process.cwd(), file);
    return require(resolved);
  }
  // Allow full crawler instances to be passed in during testing.
  return file;
}

export function consoleDisplayValue(level: number, value: string) {
  switch (level) {
    case 2:
      return chalk.red(value);
    case 1:
      return chalk.yellow(value);
    default:
      return value;
  }
}

export function stringLength(data: string) {
  return strip(data).length;
}
