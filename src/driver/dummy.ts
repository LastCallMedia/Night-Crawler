import { Driver, CrawlerRequest, DriverResponse } from '../types';
import { performance } from 'perf_hooks';

type DummyResponse = {
  statusCode: number;
  time: number;
};

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
export default class DummyDriver implements Driver {
  fetch(
    req: CrawlerRequest & { shouldFail?: string }
  ): Promise<DriverResponse> {
    const start = performance.now();
    const delay = 'delay' in req ? parseInt(req.delay as string) : 0;
    if ('shouldFail' in req && req.shouldFail) {
      return delayReject<DummyResponse>(req.shouldFail, delay);
    }
    return delayResolve<DummyResponse>(
      { statusCode: 200, time: performance.now() - start },
      delay
    );
  }
}
