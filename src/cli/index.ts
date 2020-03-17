import yargs, { MiddlewareFunction } from 'yargs';
import path from 'path';
import TestContext from '../testing/TestContext';

interface PreloadCrawlerArgs {
  config: string;
}
export interface ConfigArgs {
  config?: string;
  context: TestContext;
}

const loadConfig: MiddlewareFunction<PreloadCrawlerArgs> = argv => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const context = require(path.resolve(process.cwd(), argv.config));
  if (context instanceof TestContext) {
    return {
      context
    };
  }
  throw new Error(
    `The configuration file at ${argv.config} does not export a valid test context.`
  );
};

yargs
  .options({
    config: { type: 'string', default: './nightcrawler.js' }
  })
  .commandDir('commands')
  .middleware(loadConfig)
  .demandCommand(1, '')
  .help().argv;
