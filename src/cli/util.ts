import { TestResultMap } from '../testing/TestContext';

export function hasFailure(result: TestResultMap): boolean {
  return Array.from(result.values()).some(r => !r.pass);
}

export function pickFailures(result: TestResultMap): TestResultMap {
  return new Map(
    Array.from(result.entries()).filter(([, result]) => !result.pass)
  );
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
  if (isAsyncIterable(iter)) {
    return iter;
  }
  if (isIterable(iter)) {
    return (async function*(): AsyncIterable<T> {
      yield* iter;
    })();
  }
  throw new Error(
    'Unable to create an async iterator from the request iterable.'
  );
}
