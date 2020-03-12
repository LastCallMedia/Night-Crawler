import Reporter from './Reporter';
import { TestResult, TestResultMap } from '../../testing/TestContext';
import { writeFile } from 'fs';
import { promisify } from 'util';

const writeFileP = promisify(writeFile);

function mapToObj<T = unknown>(map: Map<string, T>): { [k: string]: T } {
  const obj = Object.create(null);
  for (const [k, v] of map) {
    obj[k] = v;
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
    this.collected.push({ url, result: mapToObj<TestResult>(result) });
  }
  async stop(): Promise<void> {
    await writeFileP(this.path, JSON.stringify(this.collected, null, 4));
  }
}
