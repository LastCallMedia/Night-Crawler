import { StdoutShape } from '../index';

export default async function(stdout: StdoutShape): Promise<void> {
  stdout.write(`usage: nightcrawler [<options>]

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
}
