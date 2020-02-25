import yargs, { MiddlewareFunction } from 'yargs';
import { requireCrawler } from './util';
import Crawler from '../crawler';

interface PreloadCrawlerArgs {
  config: string;
  crawler?: Crawler;
}
export interface ConfigArgs {
  config?: string;
  crawler: Crawler;
}

const loadCrawler = (argv: PreloadCrawlerArgs) => {
  try {
    argv.crawler = requireCrawler(argv.config);
  } catch (e) {
    throw new Error(`Unable to load crawler from ${argv.config}`);
  }
};

yargs
  .options({
    config: { type: 'string', default: './nightcrawler.js' }
  })
  .commandDir('commands')
  .middleware(loadCrawler)
  .demandCommand(1, '')
  .help().argv;
