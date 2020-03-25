import stream from 'stream';
import version from '../version';

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
    const currentVersion = require('../../../../package.json').version;
    await version(stdout);
    expect(stdout.read().toString()).toEqual(currentVersion + '\n');
  });
});
