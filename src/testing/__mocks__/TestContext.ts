const MockedContext = jest.fn();
Object.assign(MockedContext.prototype, {
  test: jest.fn(),
  after: jest.fn(),
  crawl: jest.fn(async function*() {
    yield* [];
  })
});

export default MockedContext;
