import TestContext, { TestResult, TestResultMap } from '../testing/TestContext';

export function makeResult(obj: { [k: string]: TestResult }): TestResultMap {
  return new Map(Object.entries(obj));
}

export function hasFailure(result: TestResultMap): boolean {
  return Array.from(result.values()).some(r => !r.pass);
}

export function loadContext(configFile: string, cwd: string): TestContext {
  let resolved: string;
  try {
    resolved = require.resolve(configFile, { paths: [cwd] });
  } catch (e) {
    throw new Error(`Unable to find configuration file at ${configFile}.`);
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const context = require(resolved);

  if (context instanceof TestContext) {
    return context;
  }
  throw new Error(
    `The configuration file at ${configFile} does not export a valid test context.`
  );
}
