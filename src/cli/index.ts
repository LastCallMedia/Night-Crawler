import { FailedAnalysisError } from './errors';
import cli from './cli';

export type StdoutShape = NodeJS.WritableStream & { columns: number };

cli(process.argv, process.stdout, process.cwd()).then(
  () => process.exit(0),
  (err: Error | string) => {
    console.error(err instanceof FailedAnalysisError ? err.message : err);
    process.exit(1);
  }
);
