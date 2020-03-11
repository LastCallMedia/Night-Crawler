import { CrawlerUnit } from '../types';

function unitInGroup(unit: CrawlerUnit, group: string): boolean {
  return !!unit.request.groups?.includes(group);
}

function filterOneByGroup(
  group: string,
  cb: OneHandler['cb']
): OneHandler['cb'] {
  return (unit): void => {
    if (unitInGroup(unit, group)) {
      cb(unit);
    }
  };
}
function filterManyByGroup(
  group: string,
  cb: ManyHandler['cb']
): ManyHandler['cb'] {
  return (units): void => {
    const matching = units.filter(unit => unitInGroup(unit, group));
    if (matching.length) {
      cb(matching);
    }
  };
}
interface OneHandler {
  description: string;
  cb: (unit: CrawlerUnit) => void;
}
interface ManyHandler {
  description: string;
  cb: (units: CrawlerUnit[]) => void;
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

  each(description: OneHandler['description'], cb: OneHandler['cb']): this {
    this.oneHandlers.push({ description, cb });
    return this;
  }
  all(description: ManyHandler['description'], cb: ManyHandler['cb']): this {
    this.manyHandlers.push({ description, cb });
    return this;
  }
  eachInGroup(
    description: OneHandler['description'],
    group: string,
    cb: OneHandler['cb']
  ): this {
    return this.each(description, filterOneByGroup(group, cb));
  }
  allInGroup(
    description: ManyHandler['description'],
    group: string,
    cb: ManyHandler['cb']
  ): this {
    return this.all(description, filterManyByGroup(group, cb));
  }
  testUnit(unit: CrawlerUnit): TestResult {
    return this.oneHandlers.reduce((results, handler) => {
      try {
        handler.cb(unit);
        results.set(handler.description, true);
      } catch (e) {
        results.set(handler.description, false);
      }
      return results;
    }, new Map<string, boolean>());
  }
  testUnits(units: CrawlerUnit[]): TestResult {
    return this.manyHandlers.reduce((results, handler) => {
      try {
        handler.cb(units);
        results.set(handler.description, true);
      } catch (e) {
        results.set(handler.description, false);
      }
      return results;
    }, new Map<string, boolean>());
  }
}
