import parser from 'minimist';
import crawl from './commands/crawl';
import version from './commands/version';
import help from './commands/help';
import { loadContext } from './util';

export type StdoutShape = NodeJS.WritableStream & { columns: number };

export type ArgVShape = {
  config: string;
  concurrency?: string | number;
  json?: string;
  junit?: string;
  silent?: boolean;
  help?: boolean;
  version?: boolean;
};

function massageConcurrency(
  concurrency: string | number | undefined,
  defaultValue: number
): number {
  if (concurrency === undefined || concurrency === '') {
    return defaultValue;
  }
  return typeof concurrency === 'string' ? parseInt(concurrency) : concurrency;
}

export default async function(
  input: string[],
  stdout: StdoutShape,
  cwd: string
): Promise<void> {
  const argv = parser<ArgVShape>(input, {
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
    return help(stdout);
  } else if (argv.version) {
    return version(stdout);
  } else {
    return crawl(
      {
        ...argv,
        concurrency: massageConcurrency(argv.concurrency, 5),
        context: loadContext(argv.config, cwd)
      },
      stdout
    );
  }
}
