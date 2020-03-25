import stream from 'stream';
import help from '../help';

class MockTTY extends stream.PassThrough {
  columns: number;
  constructor() {
    super();
    this.columns = 60;
  }
}
describe('Version command', function() {
  let stdout: MockTTY;

  beforeEach(function() {
    stdout = new MockTTY();
  });

  it('Should return the version from package.json', async function() {
    await help(stdout);
    expect(stdout.read().toString()).toMatchInlineSnapshot(`
      "usage: nightcrawler [<options>]

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
          
      "
    `);
  });
});
