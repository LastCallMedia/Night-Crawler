import { TestResult } from '../testing/TestContext';

export function hasFailure(result: TestResult): boolean {
  return Array.from(result.values()).some(r => !r);
}

export function pickFailures(result: TestResult): TestResult {
  return new Map(Array.from(result.entries()).filter(([, result]) => !result));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isAsyncIterable<T = unknown>(x: any): x is AsyncIterable<T> {
  return x !== null && typeof x[Symbol.asyncIterator] === 'function';
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isIterable<T = unknown>(x: any): x is Iterable<T> {
  return typeof x !== null && typeof x[Symbol.iterator] === 'function';
}

export function toAsyncIterable<T extends unknown>(
  iter: Iterable<T> | AsyncIterable<T>
): AsyncIterable<T> {
  if(isAsyncIterable(iter)) {
    return iter
  }
  if(isIterable(iter)) {
    return async function* (): AsyncIterable<T> {
      yield* iter
    }();
  }
  throw new Error('Unable to create an async iterator from the request iterable.');
}

