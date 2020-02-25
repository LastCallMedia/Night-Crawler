import formatJUnit from '../junit';
import Analysis from '../../../analysis';
import Number from '../../../metrics/Number';
import fs from 'fs';
import os from 'os';

describe('JUnit formatter', function() {
  it('Should output a listing of results', function() {
    var a = new Analysis('test', new Date());
    a.addResult('OK', 0, 10, 'm1');
    a.addResult('WARN', 1, 10, 'm1');
    a.addResult('ERR', 2, 10, 'm1');
    expect(formatJUnit(a)).toMatchSnapshot();
  });
  it('Should output aggregates, marked by level', function() {
    var a = new Analysis('test', new Date());
    a.addMetric('ok', new Number('OK metric', 0, 0));
    a.addMetric('warn', new Number('WARN metric', 1, 2));
    a.addMetric('err', new Number('ERR metric', 2, 5));
    expect(formatJUnit(a)).toMatchSnapshot();
  });
  it('Should output to a file', function() {
    var filename = `${os.tmpdir()}/nightcrawler-${Math.floor(
      Math.random() * 10000
    )}`;
    var a = new Analysis('test', new Date());
    formatJUnit(a, { filename });
    expect(fs.existsSync(filename)).toEqual(true);
    fs.unlinkSync(filename);
  });
});
