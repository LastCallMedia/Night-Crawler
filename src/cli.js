const yargs = require('yargs');
const path = require('path');
const fs = require('fs');

function requireCrawler(file) {
  return require(path.resolve(process.cwd(), file));
}
function writeReport(filename, report) {
  if (filename) {
    fs.writeFileSync(filename, JSON.stringify(report), 'utf8');
  }
}

function loadReport(filename) {
  return JSON.parse(fs.readFileSync(filename));
}

yargs
  .option('filename', {
    alias: 'f',
    default: './nightcrawler.js',
    describe: 'crawler definition',
    demandOption: true
  })
  .command({
    command: 'run',
    builder: yargs => {
      yargs.option('output', {
        alias: 'o',
        describe: 'path to write output data to'
      });
    },
    handler: async function(argv) {
      console.log('Running crawler... this may take a while.');
      var crawler = requireCrawler(argv.filename);
      var report = await crawler.crawl();
      crawler.close();
      console.log('Crawling complete');
      writeReport(argv.output, report);
      if (argv.analyze) {
        crawler.analyze(report);
      }
    }
  })
  .command({
    command: 'analyze <inputfile>',
    builder: yargs => {
      yargs.positional('inputfile', {
        describe: 'The name of the report file to analyze'
      });
    },
    handler: async function(argv) {
      var crawler = loadCrawler(argv.filename);
      var data = loadReport(argv.inputfile);
      await crawler.analyze(data);
    }
  })
  .help()
  .demandCommand().argv;
