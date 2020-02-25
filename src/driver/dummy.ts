import { Driver, CrawlRequest, DriverResponse } from '../types';

type DummyResponse = DriverResponse & Record<string, unknown>;

/**
 * Dummy driver for use in testing.
 */
export default class DummyDriver implements Driver<DummyResponse> {
  fetch(req: CrawlRequest): Promise<DummyResponse> {
    if ('shouldFail' in req && req.shouldFail) {
      const message = req.shouldFail as string;
      return Promise.reject(new Error(message.toString()));
    }
    return Promise.resolve(req);
  }
  collect(): { driverCollected: boolean } {
    return {
      driverCollected: true
    };
  }
}
