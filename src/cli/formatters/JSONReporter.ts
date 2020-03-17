import Reporter from './Reporter';
import { TestResult, TestResultMap } from '../../testing/TestContext';
import { writeFile } from 'fs';
import { promisify } from 'util';
import strip from 'strip-ansi';

const writeFileP = promisify(writeFile);

function stripResult(object: { [k: string]: string | boolean }): { [k: string]: string | boolean } {
  const ret = Object.create(null);
  for (const [k, v] of Object.entries(object)) {
    ret[k] = typeof v === 'string' ? strip(v) : v;
  }
  return ret;
}

function mapToObj(map: Map<string, TestResult>): { [k: string]: TestResult } {
  const obj = Object.create(null);
  for (const [k, v] of map) {
    obj[strip(k)] = stripResult(v);
  }
  return obj;
}


export default class JSONReporter implements Reporter {
  path: string;
  collected: { url: string; result: { [k: string]: TestResult } }[];
  constructor(path: string) {
    this.path = path;
    this.collected = [];
  }
  async start(): Promise<void> {
    // no-op.
  }
  report(url: string, result: TestResultMap): void {
    this.collected.push({ url, result: mapToObj(result) });
  }
  async stop(): Promise<void> {
    await writeFileP(this.path, JSON.stringify(this.collected, null, 4));
  }
}
