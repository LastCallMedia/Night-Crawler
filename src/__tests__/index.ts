import Crawler from '../';

describe('Index File', function() {
  it('Should export a crawler', function() {
    expect(typeof Crawler).toEqual('function');
  });
  it('Should attach drivers as an object on the crawler', function() {
    expect(typeof Crawler.drivers.request).toBe('function');
  });
  it('Should attach metrics as an object on the crawler', function() {
    expect(typeof Crawler.metrics.Number).toBe('function');
    expect(typeof Crawler.metrics.Milliseconds).toBe('function');
    expect(typeof Crawler.metrics.Percent).toBe('function');
  });
});
