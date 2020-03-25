import cli from '../';
import help from '../commands/help';
import version from '../commands/version';
import crawl from '../commands/crawl';
import { loadContext } from '../util';
import stream from 'stream';
import { mocked } from 'ts-jest/utils';
import TestContext from '../../testing/TestContext';

jest.mock('../util');
jest.mock('../commands/help');
jest.mock('../commands/version');
jest.mock('../commands/crawl');
jest.mock('../../testing/TestContext');

class MockTTY extends stream.PassThrough {
  columns: number;
  constructor() {
    super();
    this.columns = 60;
  }
}

describe('CLI', function() {
  let stdout: MockTTY;
  const cwd = '/foo';

  beforeEach(() => {
    stdout = new MockTTY();
    mocked(loadContext).mockClear();
    mocked(crawl).mockClear();
  });

  it('Should trigger help if the --help flag is passed', async function() {
    await cli(['--help'], stdout, cwd);
    expect(help).toHaveBeenCalledWith(stdout);
  });

  it('Should trigger version if the --version flag is passed', async function() {
    await cli(['--version'], stdout, cwd);
    expect(version).toHaveBeenCalledWith(stdout);
  });

  it('Should should attempt to load the configuration from the default location', async function() {
    await cli([], stdout, cwd);
    expect(loadContext).toHaveBeenCalledWith('./nightcrawler.js', cwd);
  });

  it('Should accept a flag for the configuration to load', async function() {
    await cli(['--config', 'foo.js'], stdout, cwd);
    expect(loadContext).toHaveBeenCalledTimes(1);
    expect(loadContext).toHaveBeenCalledWith('foo.js', cwd);
  });

  it('Should should pass through errors when loading context.', async function() {
    const mockedLoadContext = mocked(loadContext);
    mockedLoadContext.mockImplementationOnce(() => {
      throw new Error('foo');
    });
    await expect(cli([], stdout, cwd)).rejects.toThrow('foo');
  });

  it('Should pass test context through to crawl', async function() {
    const ctx = new TestContext('');
    const mockedLoadContext = mocked(loadContext);
    mockedLoadContext.mockImplementationOnce(() => ctx);
    await cli([], stdout, cwd);
    expect(crawl).toHaveBeenCalledWith(expect.objectContaining({
      context: ctx
    }), expect.anything());
  })

  it('Should pass default values to crawl', async function() {
    await cli([], stdout, cwd);
    expect(crawl).toHaveBeenCalledWith(
      expect.objectContaining({
        concurrency: 5,
        silent: false
      }),
      expect.anything()
    );
    expect(crawl).toHaveBeenCalledWith(
      expect.not.objectContaining({
        junit: expect.anything(),
        json: expect.anything()
      }),
      expect.anything()
    );
  });

  it('Should pass stdout to crawl', async function() {
    await cli([], stdout, cwd);
    expect(crawl).toHaveBeenCalledWith(expect.anything(), stdout);
  });

  it('Should massage concurrency values', async function() {
    await cli(['--concurrency', '15'], stdout, cwd);
    expect(crawl).toHaveBeenCalledWith(
      expect.objectContaining({
        concurrency: 15
      }),
      expect.anything()
    );
    await cli(['--concurrency'], stdout, cwd);
    expect(crawl).toHaveBeenCalledWith(
      expect.objectContaining({
        concurrency: 5
      }),
      expect.anything()
    );
  });

  it('Should pass junit flag', async function() {
    await cli(['--junit', 'test.xml'], stdout, cwd);
    expect(crawl).toHaveBeenCalledWith(
      expect.objectContaining({
        junit: 'test.xml'
      }),
      expect.anything()
    );
  });

  it('Should pass json flag', async function() {
    await cli(['--json', 'test.json'], stdout, cwd);
    expect(crawl).toHaveBeenCalledWith(
      expect.objectContaining({
        json: 'test.json'
      }),
      expect.anything()
    );
  });

  it('Should pass silent flag', async function() {
    await cli(['--silent'], stdout, cwd);
    expect(crawl).toHaveBeenCalledWith(
      expect.objectContaining({
        silent: true
      }),
      expect.anything()
    );
  });
});
