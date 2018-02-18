import type { Driver, CrawlRequest } from '../types';

/**
 * Dummy driver for use in testing.
 */
export default class DummyDriver implements Driver {
  fetch(req: CrawlRequest): Promise<Object> {
    if (req.shouldFail) {
      return Promise.reject(new Error(req.shouldFail));
    }
    return Promise.resolve(req);
  }
  collect(res: Object) {
    return {
      driverCollected: true
    };
  }
}
