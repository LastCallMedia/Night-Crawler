const yargs = require('yargs');
const path = require('path');
const fs = require('fs');
var ProgressBar = require('ascii-progress');
const formatters = require('./report');

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
  log(...args) {
    console.log(...args);
  }
}

class SilentOutput {
  start() {}
  tick() {}
  completed() {}
  log() {}
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
      yargs.option('c', {
        alias: 'concurrency',
        describe: 'the number of requests to make concurrently',
        default: 3
      });
    },
    handler: async function(argv) {
      var output = argv.s ? new SilentOutput() : new ConsoleOutput();
      output.start();
      var crawler = requireCrawler(argv.filename);
      crawler.on('response', () => output.tick(crawler.queue.length));
      var data = await crawler.crawl(argv.concurrency);
      crawler.close();
      output.completed();
      writeReport(argv.output, data);
      if (!argv.a) {
        var analysis = await crawler.analyze(data);
        output.log(new formatters.ConsoleFormatter(analysis).report());
      }
    }
  })
  .command({
    command: 'analyze <inputfile>',
    builder: yargs => {
      yargs.positional('inputfile', {
        describe: 'The name of the report file to analyze'
      });
      yargs.option('format', {
        alias: 'o',
        describe: 'the report format',
        default: 'console'
      });
    },
    handler: async function(argv) {
      var crawler = requireCrawler(argv.filename);
      var dataPoints = loadReport(argv.inputfile);
      var report = await crawler.analyze(dataPoints, report);
      var reporter;
      switch (argv.format) {
        case 'console':
          reporter = new formatters.ConsoleFormatter(report);
          break;
        case 'junit':
          reporter = new formatters.JunitFormatter(report);
          break;
        default:
          throw new Error(`Invalid output format: ${arg.format}`);
      }
      console.log(reporter.report());
    }
  })
  .command({
    command: 'compare <inputfile1> <inputfile2>',
    builder: yargs => {
      yargs.positional('inputfile1', {
        describe: 'the first data file to compare'
      });
      yargs.positional('inputfile2', {
        describe: 'the second data file to compare'
      });
    },
    handler: async function(argv) {
      var crawler = requireCrawler(argv.filename);
      var report1 = await crawler.analyze(loadReport(argv.inputfile1));
      var report2 = await crawler.analyze(loadReport(argv.inputfile2));

      var reporter = new formatters.ConsoleComparisonFormatter([
        report1,
        report2
      ]);

      console.log(reporter.report());
    }
  })
  .help()
  .demandCommand().argv;
