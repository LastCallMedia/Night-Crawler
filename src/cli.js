const yargs = require('yargs');
const path = require('path');
const fs = require('fs');
var ProgressBar = require('ascii-progress');

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

class ConsoleOutput {
  start() {
    this.progress = new ProgressBar({ total: 1 });
  }
  tick(total) {
    this.progress.total = total;
    this.progress.tick();
  }
  completed() {
    let elapsed = 0;
    if (!isNaN(this.progress.start)) {
      elapsed = Math.round((new Date() - this.progress.start) / 1000);
    }
    console.log(`Crawled ${this.progress.total} urls in ${elapsed}s`);
  }
}

class SilentOutput {
  start() {}
  tick() {}
  completed() {}
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
        describe: 'path to write output data to',
        type: 'string'
      });
      yargs.option('a', {
        alias: 'skip-analysis',
        describe: 'skip analyzing data',
        type: 'boolean'
      });
      yargs.option('s', {
        alias: 'silent',
        describe: 'do not show progress during crawling'
      });
    },
    handler: async function(argv) {
      var output = argv.s ? new SilentOutput() : new ConsoleOutput();
      output.start();
      var crawler = requireCrawler(argv.filename);
      crawler.on('response', () => output.tick(crawler.queue.length));
      var report = await crawler.crawl();
      crawler.close();
      output.completed();
      writeReport(argv.output, report);
      if (!argv.a) {
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
