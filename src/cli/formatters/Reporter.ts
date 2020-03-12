import { TestResultMap } from '../../testing/TestContext';

export default interface Reporter {
  start(): Promise<void>;
  report(url: string, result: TestResultMap): void;
  stop(): Promise<void>;
}
