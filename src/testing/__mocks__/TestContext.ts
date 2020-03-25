const TestContext = jest.requireActual('../TestContext').default;

export default jest.fn().mockImplementation(() => {
  const context = new TestContext();
  context.iterator = [];
  context.test = jest.fn();
  context.after = jest.fn();
  context.crawl = jest.fn(async function*() {
    yield* context.iterator;
  });
  return context;
});
