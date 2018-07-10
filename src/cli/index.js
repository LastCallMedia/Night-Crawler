import yargs from 'yargs';
import { requireCrawler } from './util';

yargs.option('config').default('config', './nightcrawler.js');

try {
  const crawler = requireCrawler(yargs.argv.config);
} catch (e) {
  throw new Error(`Unable to load crawler from ${yargs.argv.config}`);
}

function visitCommand(command) {
  const oldHandler = command.handler;

  // Inject the crawler into the command.
  command.handler = function(argv) {
    return oldHandler(argv, crawler);
  };

  return command;
}

// I need environment, sample size, auth.

yargs
  .commandDir('commands', {
    visit: visitCommand
  })
  .demandCommand(1, '')
  .help().argv;
