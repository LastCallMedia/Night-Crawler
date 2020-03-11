import xml from 'xml';
import { TestResultMap, EachResultMap } from '../../testing/TestContext';
import { hasFailure, pickFailures } from '../util';

type XMLAttributeObj = { [k: string]: number | string };
type XMLElement = { [k: string]: number | string | XMLElement | XMLElement[] };

class TestCase {
  className: string;
  name?: string;
  time: number;
  output?: string;
  failure?: string | boolean;
  error?: string | boolean;
  constructor(className: string, name?: string, time?: number) {
    this.className = className;
    if (name !== undefined) {
      this.name = name;
    }
    this.time = time === undefined ? 0 : time;
  }
  isFailure(): boolean {
    return this.failure !== undefined && this.failure !== false;
  }
  isError(): boolean {
    return this.error !== undefined && this.error !== false;
  }
  _attr(): XMLAttributeObj {
    const attr: XMLAttributeObj = {
      classname: this.className,
      time: this.time
    };
    if (this.name !== undefined) {
      attr.name = this.name;
    }
    if (this.time !== undefined) {
      attr.time = this.time;
    }
    return attr;
  }
  toXMLObj(): XMLElement {
    const parts: XMLElement[] = [{ _attr: this._attr() }];
    if (this.error === true) {
      parts.push({ error: {} });
    } else if (typeof this.error === 'string') {
      parts.push({ error: { _attr: { message: this.error } } });
    }
    if (this.failure === true) {
      parts.push({ failure: {} });
    } else if (typeof this.failure === 'string') {
      parts.push({ failure: { _attr: { message: this.failure } } });
    }
    if (this.output !== undefined) {
      parts.push({
        'system-out': {
          _cdata: this.output
        }
      });
    }
    return { testcase: parts.length > 1 ? parts : parts[0] };
  }
}

class TestSuite {
  name: string;
  cases: TestCase[];

  constructor(name: string) {
    this.name = name;
    this.cases = [];
  }
  addCase(addedCase: TestCase): this {
    this.cases.push(addedCase);
    return this;
  }
  _attr(): XMLAttributeObj {
    return {
      name: this.name,
      tests: this.cases.length,
      failures: this.cases.filter(c => c.isFailure()).length,
      errors: this.cases.filter(c => c.isError()).length,
      skipped: 0,
      time: this.cases.reduce((elapsed, testCase) => elapsed + testCase.time, 0)
    };
  }
  toXMLObj(): XMLElement {
    const parts: XMLElement[] = [{ _attr: this._attr() }];
    return { testsuite: parts.concat(this.cases.map(c => c.toXMLObj())) };
  }
}

function formatEachResults(results: EachResultMap): XMLElement {
  const suite = new TestSuite('EachResults');
  Array.from(results.entries()).forEach(([url, result]) => {
    const thisCase = new TestCase(url);
    if (hasFailure(result)) {
      thisCase.failure = Array.from(pickFailures(result).keys()).join('\n');
    }
    suite.addCase(thisCase);
  });
  return suite.toXMLObj();
}

function formatAllResults(results: TestResultMap): XMLElement {
  const suite = new TestSuite('AllResults');
  Array.from(results.entries()).forEach(([url, result]) => {
    const thisCase = new TestCase(url);
    if (!result) {
      thisCase.failure = true;
    }
    suite.addCase(thisCase);
  });
  return suite.toXMLObj();
}

export default function formatJUnit(
  eachResults: EachResultMap,
  allResults: TestResultMap
): string {
  const each = formatEachResults(eachResults);
  const all = formatAllResults(allResults);

  return xml(
    {
      testsuites: [each, all]
    },
    { indent: '  ', declaration: true }
  );
}
