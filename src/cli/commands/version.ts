import { StdoutShape } from '../index';

export default async function(stdout: StdoutShape): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pkg = require('../../../package.json');
  stdout.write(pkg.version + '\n');
}
