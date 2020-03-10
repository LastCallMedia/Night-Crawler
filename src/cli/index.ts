import yargs, { MiddlewareFunction } from 'yargs';
import Crawler from '../crawler';
import path from 'path';
import TestContext from '../testing/TestContext';

interface PreloadCrawlerArgs {
  config: string;
  crawler?: Crawler;
}
export interface ConfigArgs {
  config?: string;
  crawler: Crawler;
  tests: TestContext;
}

function requireConfig(file: string): { crawler: Crawler; tests: TestContext } {
  const resolved = path.resolve(process.cwd(), file);
  return require(resolved);
}

const loadConfig: MiddlewareFunction<PreloadCrawlerArgs> = argv => {
  try {
    const config = requireConfig(argv.config);
    argv.crawler = config.crawler;
    argv.tests = config.tests;
  } catch (e) {
    throw new Error(
      `Unable to load crawler from ${argv.config} due to error: ${e.toString()}`
    );
  }
};

yargs
  .options({
    config: { type: 'string', default: './nightcrawler.js' }
  })
  .commandDir('commands')
  .middleware(loadConfig)
  .demandCommand(1, '')
  .help().argv;
