import * as index from '../';

describe('Index', function() {
  it('Should export the crawl function', function() {
    expect(index).toHaveProperty('crawl');
    expect(typeof index.crawl).toBe('function');
  })
  it('Should export the test function', function() {
    expect(index).toHaveProperty('test');
    expect(typeof index.test).toBe('function');
  });

  it('Should export the after function', function() {
    expect(index).toHaveProperty('after');
    expect(typeof index.after).toBe('function');
  });

  it('Should export the crawler function', function() {
    expect(index).toHaveProperty('Crawler');
    expect(typeof index.Crawler).toBe('function');
  });

  it('Should not export any unknown properties', function() {
    const knowns = ['test', 'after', 'crawl', 'Crawler'];
    const unknowns = Object.keys(index).filter(k => !knowns.includes(k));
    expect(unknowns).toEqual([]);
  });
});
