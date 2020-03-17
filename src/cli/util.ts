import { TestResult, TestResultMap } from '../testing/TestContext';

export function makeResult(obj: { [k: string]: TestResult }): TestResultMap {
  return new Map(Object.entries(obj));
}

export function hasFailure(result: TestResultMap): boolean {
  return Array.from(result.values()).some(r => !r.pass);
}
