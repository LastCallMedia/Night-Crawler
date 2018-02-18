// @flow

import Console from './console';
import JUnit from './junit';
import { Formatter } from './types';

export default function factory(type: string, options: Object = {}): Formatter {
  switch (type) {
    case 'console':
      return new Console();
    case 'junit':
      return new JUnit(options);
  }
}
