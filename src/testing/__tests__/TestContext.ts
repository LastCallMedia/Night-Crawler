import TestContext from '../TestContext';

describe('TestContext', function() {
  it('Should invoke "each" handlers', () => {
    const handler = jest.fn();
    const context = new TestContext();
    context.each('Test', handler);
    context.testResponse({ url: 'foo' });
    expect(handler).toHaveBeenCalled();
    expect(handler).toHaveBeenCalledWith({ url: 'foo' });
  });

  it('Should invoke "all" handlers', () => {
    const handler = jest.fn();
    const context = new TestContext();
    context.all('Test', handler);
    context.testResponses([{ url: 'foo' }]);
    expect(handler).toHaveBeenCalled();
    expect(handler).toHaveBeenCalledWith([{ url: 'foo' }]);
  });

  it('Should invoke "eachInGroup" handlers.', () => {
    const handler = jest.fn();
    const context = new TestContext();
    context.eachInGroup('Test', 'foo', handler);
    context.testResponse({ url: 'foo', group: 'foo' });
    context.testResponse({ url: 'foo', group: 'bar' });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ url: 'foo', group: 'foo' });
  });

  it('Should invoke "allInGroup" handlers.', () => {
    const handler = jest.fn();
    const context = new TestContext();
    context.allInGroup('Test', 'foo', handler);
    context.testResponses([
      { url: 'foo', group: 'foo' },
      { url: 'baz', group: 'baz' }
    ]);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith([{ url: 'foo', group: 'foo' }]);
  });

  it('Should collect results for "each" handlers', function() {
    const context = new TestContext();
    context.each('pass', () => {
      /* no-op */
    });
    context.each('fail', () => {
      throw new Error('');
    });
    const result = context.testResponse({ url: 'foo', group: 'foo' });
    expect(result).toEqual(
      new Map(
        Object.entries({
          pass: true,
          fail: false
        })
      )
    );
  });
  it('Should collect results for "all" handlers', function() {
    const context = new TestContext();
    context.all('pass', () => {
      /* no-op */
    });
    context.all('fail', () => {
      throw new Error('Test');
    });

    const result = context.testResponses([
      { url: 'foo', group: 'foo' },
      { url: 'bar', group: 'bar' }
    ]);
    expect(result).toEqual(
      new Map(
        Object.entries({
          pass: true,
          fail: false
        })
      )
    );
  });
});
