import TestContext from './TestContext';
import Crawler from '../Crawler';
import { RequestIterable } from '../types';

let activeContext: TestContext | null = null;

const crawl = function(
  description: string,
  cb: () => RequestIterable | Crawler
): TestContext {
  const context = new TestContext(description);
  activeContext = context;
  let result: RequestIterable | Crawler;
  try {
    result = cb();
    if (!result) {
      throw new Error(
        `This crawl function did not return requests. Make sure you return either an iterable containing requests, or a Crawler object.`
      );
    }
    context.crawler = result instanceof Crawler ? result : new Crawler(result);
    return context;
  } finally {
    activeContext = null;
  }
};

const withActive = <A extends unknown[], R extends unknown>(
  cb: (context: TestContext, ...args: A) => R,
  name: string
) => {
  return function(...args: A): R {
    if (activeContext === null) {
      throw new Error(
        `You may not call ${name} outside of a crawler function.`
      );
    }
    return cb(activeContext, ...args);
  };
};

const test = withActive(
  (ctx, ...args: Parameters<TestContext['test']>) => ctx.test(...args),
  'test'
);
const after = withActive(
  (ctx, ...args: Parameters<TestContext['after']>) => ctx.after(...args),
  'after'
);

export { crawl, test, after };
