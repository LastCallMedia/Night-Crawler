import { Driver, CrawlerRequest, DriverResponse } from '../types';

type DummyResponse = DriverResponse & Record<string, unknown>;

function delayResolve<T>(value: T, timeout: number): Promise<T> {
  return new Promise<T>(resolve => {
    setTimeout(() => resolve(value), timeout);
  });
}
function delayReject<T>(value: unknown, timeout: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    setTimeout(() => reject(value), timeout);
  });
}

/**
 * Dummy driver for use in testing.
 */
export default class DummyDriver implements Driver<DummyResponse> {
  fetch(req: CrawlerRequest & { shouldFail?: string }): Promise<DummyResponse> {
    const delay = 'delay' in req ? parseInt(req.delay as string) : 0;
    if ('shouldFail' in req && req.shouldFail) {
      return delayReject<DummyResponse>(req.shouldFail, delay);
    }
    return delayResolve<DummyResponse>({ statusCode: 200 }, delay);
  }
  collect(): Record<string, unknown> {
    return {
      driverCollected: true
    };
  }
}
