import { CrawlerUnit } from '../types';
import Crawler from '../Crawler';
import { makeResult } from '../cli/util';

interface OneHandler {
  description: string;
  cb: (unit: CrawlerUnit) => void;
}
interface AfterHandler {
  description: string;
  cb: () => void;
}

export type PassingResult = { pass: true };
export type FailingResult = { pass: false; message: string };
export type TestResult = PassingResult | FailingResult;
export type TestResultMap<T extends TestResult = TestResult> = Map<string, T>;

export default class TestContext {
  description: string;
  crawler?: Crawler;
  testHandlers: OneHandler[];
  afterHandlers: AfterHandler[];

  constructor(description: string) {
    this.description = description;
    this.testHandlers = [];
    this.afterHandlers = [];
  }

  test(description: OneHandler['description'], cb: OneHandler['cb']): this {
    this.testHandlers.push({ description, cb });
    return this;
  }
  after(
    description: AfterHandler['description'],
    cb: AfterHandler['cb']
  ): this {
    this.afterHandlers.push({ description, cb });
    return this;
  }
  async *crawl(concurrency: number): AsyncIterable<[string, TestResultMap]> {
    if (!this.crawler) {
      throw new Error(`crawl was invoked without a valid crawler.`);
    }
    for await (const unit of this.crawler.crawl(concurrency)) {
      yield [unit.request.url, this.testUnit(unit)];
    }
    yield ['All', this.testAfter()];
  }
  private testUnit(unit: CrawlerUnit): TestResultMap {
    // Short circuit when there is a request error.
    if (unit.error) {
      return makeResult({
        'Request Failure': { pass: false, message: unit.error.toString() }
      });
    }
    return this.testHandlers.reduce((results, handler) => {
      try {
        handler.cb(unit);
        results.set(handler.description, { pass: true });
      } catch (e) {
        results.set(handler.description, {
          pass: false,
          message: e.toString()
        });
      }
      return results;
    }, new Map<string, TestResult>());
  }
  private testAfter(): TestResultMap {
    return this.afterHandlers.reduce((results, handler) => {
      try {
        handler.cb();
        results.set(handler.description, { pass: true });
      } catch (e) {
        results.set(handler.description, {
          pass: false,
          message: e.toString()
        });
      }
      return results;
    }, new Map<string, TestResult>());
  }
}
