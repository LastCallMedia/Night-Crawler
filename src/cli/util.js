// @flow
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import Crawler from '../crawler';
import strip from 'strip-ansi';

export function requireCrawler(file: string | Crawler): Crawler {
  // Allow full crawler instances to be passed in during testing.
  if (file instanceof Crawler || typeof file == 'function') {
    return file;
  }
  var resolved = path.resolve(process.cwd(), file);
  // $FlowFixMe
  return require(resolved);
}

export function writeJSON(filename: string, data: Object) {
  fs.writeFileSync(filename, JSON.stringify(data), 'utf8');
}

export function readJSON(filename: string): Object {
  return JSON.parse(fs.readFileSync(filename).toString());
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
