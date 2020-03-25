import TestContext, { TestResult, TestResultMap } from '../testing/TestContext';

export function makeResult(obj: { [k: string]: TestResult }): TestResultMap {
  return new Map(Object.entries(obj));
}

export function hasFailure(result: TestResultMap): boolean {
  return Array.from(result.values()).some(r => !r.pass);
}

export function loadContext(configFile: string, cwd: string): TestContext {
  let context: TestContext | undefined;
  try {
    const resolved = require.resolve(configFile, { paths: [cwd] });
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    context = require(resolved);
  } catch (e) {
    throw new Error(`Unable to find configuration file at ${configFile}.`);
  }

  if (context instanceof TestContext) {
    return context;
  }
  throw new Error(
    `The configuration file at ${configFile} does not export a valid test context.`
  );
}
