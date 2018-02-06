
const yargs = require('yargs');
const path = require('path');
const fs = require('fs');
require('console.table');
const Report = require('../src/report');

function loadCrawler(filename) {
    return require(path.resolve(process.cwd(), filename));
}
function writeReport(filename, report) {
    if(filename) {
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
        demandOption: true,
    })
    .command({
        command: 'run',
        builder: (yargs) => {
            yargs.option('output', {
                alias: 'o',
                describe: 'path to write output data to'
            })
        },
        handler: async function(argv) {
            console.log('Running crawler... this may take a while.');
            var crawler = loadCrawler(argv.filename);
            var report = await crawler.crawl();
            crawler.close();
            writeReport(argv.output, report);
            var metrics = gatherMetrics(report, crawler.getMetrics());
            if(metrics.length) {
                displayMetrics(metrics);
            }
            var assertions = gatherAssertions(report, crawler.getAssertions());
            if(assertions.length) {
                displayAssertions(assertions);
            }
            console.log('Crawling complete');
            checkAssertions(assertions);
        }
    })
    .command({
        command: 'analyze <inputfile>',
        builder: (yargs) => {
            yargs.positional('inputfile', {
                describe: 'The name of the report file to analyze',
            })
        },
        handler: async function(argv) {
            var crawler = loadCrawler(argv.filename);
            var report = loadReport(argv.inputfile);
            var metrics = gatherMetrics(report, crawler.getMetrics());
            if(metrics.length) {
                displayMetrics(metrics);
            }
            var assertions = gatherAssertions(report, crawler.getAssertions());
            if(assertions.length) {
                displayAssertions(assertions);
            }
            checkAssertions(assertions);
        }
    })
    .help()
    .demandCommand()
    .argv;

function displayMetrics(metrics) {
    metrics.forEach(metricGroup => {
        console.log('Name: ' + metricGroup.name);
        console.table(metricGroup.metrics);
        console.log('');
    });
}

function gatherMetrics(data, metrics) {
    var report = new Report(data);

    var ret = report.getGroups().map(group => {
        const groupData = report.getGroup(group)
        return gatherGroupMetrics(group, groupData, metrics);
    });
    ret.push(gatherGroupMetrics('Overall', report.crawlResponses, metrics));

    return ret;
}

function gatherAssertions(data, assertions) {
    return assertions.map(assertion => {
        return {
            name: assertion.displayName || assertion.name,
            status: assertion(data)
        }
    });
}

function checkAssertions(assertionData) {
    assertionData.forEach(assert => {
        if(!assert.status) {
            throw new Error(`Assertion ${assert.name} failed`);
        }
    })
}

function displayAssertions(assertionData) {
    console.log('Assertions:');
    console.table(assertionData);
}

function gatherGroupMetrics(groupName, groupData, metrics) {
    return {
        name: groupName,
        metrics: metrics.reduce((d, metric) => {
            d[metric.displayName || metric.name] = metric(groupData)
            return d
        }, {})
    }
}