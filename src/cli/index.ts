import path from 'path';
import TestContext from '../testing/TestContext';
import { FailedAnalysisError } from './errors';
import parser from 'minimist';
import { handler, CrawlArgs } from './commands/crawl';

type RawArgShape = {
  config: string;
  concurrency?: string;
  json?: string;
  junit?: string;
  silent?: boolean;
  help?: boolean;
  version?: boolean;
};

const loadContext = (configFile: string): TestContext => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const context = require(path.resolve(process.cwd(), configFile));
  if (context instanceof TestContext) {
    return context;
  }
  throw new Error(
    `The configuration file at ${configFile} does not export a valid test context.`
  );
};

function processInput(args: RawArgShape): CrawlArgs {
  return {
    context: loadContext(args.config),
    concurrency: args.concurrency ? parseInt(args.concurrency) : undefined,
    silent: args.silent,
    junit: args.junit,
    json: args.json
  };
}

const argv = parser(process.argv, {
  string: ['config', 'json', 'concurrency', 'junit'],
  boolean: ['silent', 'help', 'version'],
  default: {
    config: './nightcrawler.js',
    concurrency: 5,
    silent: false,
    help: false,
    version: false
  }
});

if (argv.help) {
  process.stdout.write(`usage: nightcrawler [<options>]

    --config=<filename>
        Name of test file (default: nightcrawler.js).
    --concurrency=<number>
        The number of requests to allow in-flight at once.
    --json=<filename>
        The name of the file to write JSON results to.
    --junit=<filename>
        The name of the file to write JUnit results to.
    --silent
        Silence all console output.
    --help
        Show the help text.
    --version
        Show the version number.
    \n`);
  process.exit(0);
} else if (argv.version) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pkg = require('../../package.json');
  process.stdout.write(`Nightcrawler: ${pkg.version}\n`);
  process.exit(0);
} else {
  handler(processInput((argv as unknown) as RawArgShape)).catch(err => {
    console.error(err instanceof FailedAnalysisError ? err.message : err);
    process.exit(1);
  });
}
