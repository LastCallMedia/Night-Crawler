import { CrawlerResponse } from '../types';

function responseInGroup(response: CrawlerResponse, group: string): boolean {
  return response.group === group;
}

function filterOneByGroup(
  group: string,
  cb: (response: CrawlerResponse) => unknown
): (response: CrawlerResponse) => unknown {
  return (response: CrawlerResponse): void => {
    if (responseInGroup(response, group)) {
      cb(response);
    }
  };
}
function filterManyByGroup(
  group: string,
  cb: (responses: CrawlerResponse[]) => void
): (responses: CrawlerResponse[]) => void {
  return (responses: CrawlerResponse[]): void => {
    const matching = responses.filter(response =>
      responseInGroup(response, group)
    );
    cb(matching);
  };
}
interface OneHandler {
  description: string;
  cb: (req: CrawlerResponse) => void;
}
interface ManyHandler {
  description: string;
  cb: (reqs: CrawlerResponse[]) => void;
}

export type TestResult = Map<string, boolean>;
export type EachResults = Map<string, TestResult>;

export default class TestContext {
  oneHandlers: OneHandler[];
  manyHandlers: ManyHandler[];

  constructor() {
    this.oneHandlers = [];
    this.manyHandlers = [];
  }

  each(description: string, cb: (req: CrawlerResponse) => void): this {
    this.oneHandlers.push({ description, cb });
    return this;
  }
  all(description: string, cb: (reqs: CrawlerResponse[]) => void): this {
    this.manyHandlers.push({ description, cb });
    return this;
  }
  eachInGroup(
    description: string,
    group: string,
    cb: (req: CrawlerResponse) => void
  ): this {
    this.oneHandlers.push({
      description,
      cb: filterOneByGroup(group, cb)
    });
    return this;
  }
  allInGroup(
    description: string,
    group: string,
    cb: (reqs: CrawlerResponse[]) => void
  ): this {
    this.manyHandlers.push({
      description,
      cb: filterManyByGroup(group, cb)
    });
    return this;
  }
  testResponse(response: CrawlerResponse): TestResult {
    return this.oneHandlers.reduce((results, handler) => {
      try {
        handler.cb(response);
        results.set(handler.description, true);
      } catch (e) {
        results.set(handler.description, false);
      }
      return results;
    }, new Map<string, boolean>());
  }
  testResponses(responses: CrawlerResponse[]): TestResult {
    return this.manyHandlers.reduce((results, handler) => {
      try {
        handler.cb(responses);
        results.set(handler.description, true);
      } catch (e) {
        results.set(handler.description, false);
      }
      return results;
    }, new Map<string, boolean>());
  }
}
