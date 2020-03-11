import TestContext from '../TestContext';

describe('TestContext', function() {
  const unit = { request: { url: 'foo' } };
  const units = [
    { request: { url: 'foo', groups: ['foo'] } },
    { request: { url: 'bar', groups: ['bar'] } }
  ];

  it('Should invoke "each" handlers', () => {
    const handler = jest.fn();
    const context = new TestContext();
    context.each('Test', handler);
    context.testUnit(unit);
    expect(handler).toHaveBeenCalled();
    expect(handler).toHaveBeenCalledWith(unit);
  });

  it('Should invoke "all" handlers', () => {
    const handler = jest.fn();
    const context = new TestContext();
    context.all('Test', handler);
    context.testUnits(units);
    expect(handler).toHaveBeenCalled();
    expect(handler).toHaveBeenCalledWith(units);
  });

  it('Should invoke "eachInGroup" handlers.', () => {
    const handler = jest.fn();
    const context = new TestContext();
    context.eachInGroup('Test', 'foo', handler);
    context.testUnit(units[0]);
    context.testUnit(units[1]);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(units[0]);
  });

  it('Should invoke "allInGroup" handlers.', () => {
    const handler = jest.fn();
    const context = new TestContext();
    context.allInGroup('Test', 'foo', handler);
    context.testUnits(units);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith([units[0]]);
  });

  it('Should not invoke "allInGroup" handlers when there are no matching requests', () => {
    const handler = jest.fn();
    const context = new TestContext();
    context.allInGroup('Test', 'baz', handler);
    context.testUnits(units);
    expect(handler).not.toHaveBeenCalled();
  });

  it('Should collect results for "each" handlers', function() {
    const unit = { request: { url: 'foo' } };
    const context = new TestContext();
    context.each('pass', () => {
      /* no-op */
    });
    context.each('fail', () => {
      throw new Error('');
    });
    const result = context.testUnit(unit);
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

    const result = context.testUnits(units);
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
