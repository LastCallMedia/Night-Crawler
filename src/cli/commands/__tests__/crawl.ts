import { handler } from '../crawl';
import stream from 'stream';
import { FailedAnalysisError } from '../../errors';
import TestContext from '../../../testing/TestContext';

import ConsoleReporter from '../../formatters/ConsoleReporter';
import JUnitReporter from '../../formatters/JUnitReporter';
import JSONReporter from '../../formatters/JSONReporter';

import { mocked } from 'ts-jest/utils';
import { makeResult } from '../../util';

jest.mock('../../../testing/TestContext');
jest.mock('../../formatters/JUnitReporter');
jest.mock('../../formatters/ConsoleReporter');
jest.mock('../../formatters/JSONReporter');

const MockedConsoleReporter = mocked(ConsoleReporter);
const MockedJUnitReporter = mocked(JUnitReporter);
const MockedJSONReporter = mocked(JSONReporter);

class MockTTY extends stream.PassThrough {
  columns: number;
  constructor() {
    super();
    this.columns = 60;
  }
}

describe('Crawl Handler', function() {
  let stdout: MockTTY;

  beforeEach(function() {
    stdout = new MockTTY();
    MockedConsoleReporter.mockReset();
    MockedJUnitReporter.mockReset();
    MockedJSONReporter.mockReset();
  });

  it('Executes the crawl', async function() {
    // eslint-disable-next-line
    const context = new TestContext('');
    context.crawl = jest.fn(async function*(): ReturnType<
      TestContext['crawl']
    > {
      // No-op.
    });
    const mockedContext = mocked(context);
    await handler({ stdout, context, concurrency: 1 });
    expect(mockedContext.crawl).toHaveBeenCalledWith(1);
  });

  it('Displays console output.', async function() {
    const context = new TestContext('');
    context.crawl = async function*(): ReturnType<TestContext['crawl']> {
      yield [
        'http://example.com',
        makeResult({ Testing: { pass: false, message: 'Test' } })
      ];
    };
    try {
      await handler({ stdout, context });
    } catch (e) {
      // no-op - we don't care.
    }
    expect(MockedConsoleReporter).toHaveBeenCalled();
    const reporter = MockedConsoleReporter.mock.instances[0];
    expect(reporter.start).toHaveBeenCalledTimes(1);
    expect(reporter.report).toHaveBeenCalledTimes(1);
    expect(reporter.stop).toHaveBeenCalledTimes(1);
  });

  it('Does not display console output if passed --silent', async function() {
    const context = new TestContext('');
    context.crawl = async function*(): ReturnType<TestContext['crawl']> {
      yield [
        'http://example.com',
        makeResult({ Testing: { pass: false, message: 'Test' } })
      ];
    };
    try {
      await handler({ stdout, context, silent: true });
    } catch (e) {
      // no-op - we don't care.
    }
    expect(MockedConsoleReporter).not.toHaveBeenCalled();
  });

  it('Writes a JUnit report', async function() {
    const context = new TestContext('');
    context.crawl = async function*(): ReturnType<TestContext['crawl']> {
      yield [
        'http://example.com',
        makeResult({ Testing: { pass: false, message: 'Test' } })
      ];
    };
    try {
      await handler({ stdout, context, junit: 'test.xml' });
    } catch (e) {
      // no-op - we don't care.
    }
    expect(MockedJUnitReporter).toHaveBeenCalledWith('test.xml');
    const reporter = MockedJUnitReporter.mock.instances[0];
    expect(reporter.start).toHaveBeenCalledTimes(1);
    expect(reporter.report).toHaveBeenCalledTimes(1);
    expect(reporter.stop).toHaveBeenCalledTimes(1);
  });

  it('Writes a JSON report', async function() {
    const context = new TestContext('');
    context.crawl = async function*(): ReturnType<TestContext['crawl']> {
      yield [
        'http://example.com',
        makeResult({ Testing: { pass: false, message: 'Test' } })
      ];
    };
    try {
      await handler({ stdout, context, json: 'test.json' });
    } catch (e) {
      // no-op - we don't care.
    }
    expect(MockedJSONReporter).toHaveBeenCalledWith('test.json');
    const reporter = MockedJSONReporter.mock.instances[0];
    expect(reporter.start).toHaveBeenCalledTimes(1);
    expect(reporter.report).toHaveBeenCalledTimes(1);
    expect(reporter.stop).toHaveBeenCalledTimes(1);
  });

  it('Throws an error if the analysis contains failures', async function() {
    const context = new TestContext('');
    context.crawl = async function*(): ReturnType<TestContext['crawl']> {
      yield [
        'http://example.com',
        makeResult({ Testing: { pass: false, message: 'Test' } })
      ];
    };
    await expect(handler({ stdout, context })).rejects.toBeInstanceOf(
      FailedAnalysisError
    );
  });

  it('Should stop the crawl if setup fails', async function() {
    const context = new TestContext('');
    context.crawl = (): ReturnType<TestContext['crawl']> => {
      throw new Error('Oh no!');
    };
    const p = handler({
      stdout,
      context
    });
    return expect(p).rejects.toThrow('Oh no!');
  });
});
