import { TestResult } from '../testing/TestContext';

export function hasFailure(result: TestResult): boolean {
  return Array.from(result.values()).some(r => !r);
}

export function pickFailures(result: TestResult): TestResult {
  return new Map(Array.from(result.entries()).filter(([, result]) => !result));
}
