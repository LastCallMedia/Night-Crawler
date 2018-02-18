// @flow

import { requireCrawler, writeJSON } from '../util';
import formatterFactory from '../formatters';
import ProgressBar from 'ascii-progress';
import { FailedAnalysisError } from '../errors';
import type yargs from 'yargs';

exports.command = 'crawl [crawlerfile]';
exports.describe = 'execute the crawl defined in the active config file';
exports.builder = (yargs: yargs) => {
  yargs.positional('crawlerfile', {
    describe: 'the name of the crawler file',
    default: 'nightcrawler.js'
  });
  yargs.option('silent', {
    alias: 'n',
    describe: 'silence all output',
    type: 'boolean',
    default: false
  });
  yargs.option('output', {
    alias: 'o',
    describe: 'filename to write JSON report to'
  });
  yargs.option('format', {
    alias: 'f',
    describe: 'the format to output analysis result in',
    default: 'console'
  });
  yargs.option('formatOptions', {
    alias: 'g',
    describe: 'formatter options, in JSON format'
  });
};
exports.handler = async function(argv: Object) {
  const { crawlerfile, silent, output, format } = argv;
  const formatOptions = argv.formatOptions
    ? JSON.parse(argv.formatOptions)
    : {};
  const crawler = requireCrawler(crawlerfile);

  let progress;
  let start = new Date();

  if (!silent) {
    console.log(`Starting crawl`);
    progress = new ProgressBar({ total: 1 });
    crawler.on('response', () => {
      progress.total = crawler.queue.length;
      progress.tick();
    });
  }

  const data = await crawler.crawl();

  if (!silent) {
    let elapsed = Math.round((new Date() - start) / 1000);
    console.log(`Crawled ${crawler.queue.length} urls in ${elapsed} seconds.`);
  }

  if (output) {
    writeJSON(output, data);
  }

  const analysis = await crawler.analyze(data);

  if (format) {
    const formatter = formatterFactory(format, formatOptions);
    let formattedOutput = formatter.format(analysis);
    if (formattedOutput) {
      console.log(formattedOutput);
    }
  }

  if (analysis.hasFailures()) {
    throw new FailedAnalysisError('Analysis reported an error');
  }
};
