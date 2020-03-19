import { CrawlerRequest } from './types';

function isAsyncIterable<T = unknown>(x: unknown): x is AsyncIterable<T> {
  return (
    x !== null &&
    typeof (x as AsyncIterable<T>)[Symbol.asyncIterator] === 'function'
  );
}

function isIterable<T = unknown>(x: unknown): x is Iterable<T> {
  return (
    typeof x !== null &&
    typeof (x as Iterable<T>)[Symbol.iterator] === 'function'
  );
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

export function isCrawlerRequest(request: unknown): request is CrawlerRequest {
  return (
    request !== null &&
    typeof request === 'object' &&
    typeof (request as CrawlerRequest).url === 'string'
  );
}

export async function all<T>(iterator: AsyncIterable<T>): Promise<T[]> {
  const collected = [];
  for await (const i of iterator) {
    collected.push(i);
  }
  return collected;
}
