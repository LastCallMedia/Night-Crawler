import yargs from 'yargs';

yargs
  .commandDir('commands')
  .demandCommand(1, '')
  .help().argv;
