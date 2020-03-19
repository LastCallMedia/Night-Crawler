import { Driver } from '../types';
import { performance } from 'perf_hooks';

function delay(ms: number): Promise<void> {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

type DummyOptions = {
  delay?: number;
  shouldFail?: string;
};

const dummy: Driver = (url: string, options: DummyOptions = {}) => {
  const start = performance.now();
  const delayMS = options.delay ?? 0;
  if (options.shouldFail !== undefined) {
    return delay(delayMS).then(() => Promise.reject(options.shouldFail));
  }
  return delay(delayMS).then(() => ({
    statusCode: 200,
    time: performance.now() - start
  }));
};

export default dummy;
