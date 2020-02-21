import Crawler from '../crawler';
import Analysis from '../analysis';
import DummyDriver from '../driver/dummy';
import {CrawlRequest, CrawlResponse} from "../types";
import crawler from "../crawler";

describe('Crawler', () => {
  it('Should return an object containing the results of the crawl', function() {
    return new Crawler('').crawl().then(report => {
      expect(report).toBeInstanceOf(Object);
      expect(report.date).toBeInstanceOf(Date);
      expect(report.data).toEqual([]);
    });
  });

  it('Should invoke the setup event at the start of crawling', function() {
    var cb = jest.fn();
    var c = new Crawler('');
    c.on('setup', cb);
    return c
      .crawl()
      .then(() => {
        // Asserts called 1x, with crawler as arg.
        expect(cb.mock.calls).toEqual([[c]]);
      });
  });
  it('Should throw an error when setup throws an error', async function() {
    const c = new Crawler('');
    c.on('setup', function() {
      return Promise.reject('reason');
    })
    await expect(c.setup()).rejects.toEqual('Setup failed with an error: reason');
  })

  describe('Enqueue', function() {
    it('Should normalize requests that are added to the queue', function() {
      var tests = ['foo', { url: 'foo' }];
      tests.forEach(function(t) {
        var c = new Crawler('').enqueue(t);
        expect(c.queue).toEqual([
          {
            url: 'foo'
          }
        ]);
      });
    });

    it('Should accept additional data that is enqueued', function() {
      var c = new Crawler('').enqueue({ url: 'foo', foo: 'bar' });
      expect(c.queue).toEqual([
        {
          url: 'foo',
          foo: 'bar'
        }
      ]);
    });
  });

  describe('Crawling', function() {
    it('Should should invoke success callback with the appropriate arguments', async function() {
      const cb = jest.fn();
      var called = 0;
      const c = new Crawler('', new DummyDriver());
      c.on('setup', (c: Crawler) => c.enqueue('http://example.com/success'))
      c.on('response.success', cb);

      await c.crawl();
      expect(cb.mock.calls.length).toEqual(1);
      expect(cb.mock.calls[0][0]).toEqual({url: 'http://example.com/success'});
    });

    it('Should invoke failure callback with the appropriate arguments', async function() {
      const cb = jest.fn();
      const c = new Crawler('', new DummyDriver());
      c.on('setup', (c: Crawler) => c.enqueue({url: 'http://example.com/fail', shouldFail: 'test'}))
      c.on('response.error', cb);
      await c.crawl();
      expect(cb.mock.calls.length).toEqual(1);
      expect(cb.mock.calls[0][0]).toEqual(new Error('test'));
    });

    it('Should return an array of collected data about responses', function() {
      const c =  new Crawler('', new DummyDriver())
      c.on('setup', (c: Crawler) => {
        c.enqueue({ url: 'http://example.com/fail', shouldFail: 'test' });
        c.enqueue('http://example.com/success');
      })

      return c.crawl()
        .then(({ data }) => {
          expect(data.length).toEqual(2);
          expect(data[0].url).toEqual('http://example.com/fail');
          expect(data[1].url).toEqual('http://example.com/success');
          expect(data[0].error).toEqual(true);
          expect(data[1].error).toEqual(false);
          expect(data[1].driverCollected).toEqual(true);
        });
    });

    it('Should pass additional data that was queued', function() {
      const c = new Crawler('', new DummyDriver())
      c.on('setup', (c: Crawler) => c.enqueue({ url: 'http://example.com/success', foo: 'bar' }));

      return c.crawl()
        .then(({ data }) => {
          expect(data[0].foo).toEqual('bar')
        });
    });

    it('Should collect data added through the response.success event', function() {
      const c = new Crawler('', new DummyDriver())
      c.on('setup', (c: Crawler) => c.enqueue('http://example.com/success'))
      c.on('response.success', function(response: CrawlResponse, data: CrawlResponse) {
        data.touched = 1;
      })
      return c.crawl()
        .then(({ data }) => {
          expect(data[0].touched).toEqual(1)
        });
    });

    it('Should bubble up errors thrown during processing of response.success', async function() {
      const success = jest.fn(() => {
        throw new Error('test');
      })
      const fail = jest.fn();
      const c = new Crawler('', new DummyDriver());
      c.on('setup', (c: Crawler) => c.enqueue('http://example.com/success'))
      c.on('response.success', success);
      c.on('response.error', fail);
      await expect(c.crawl()).rejects.toEqual('An error was caught during processing of a successful result: Error: test')
      // Make sure we haven't also invoked the error handler.
      expect(fail.mock.calls.length).toEqual(0);
    });

    it('Should bubble up errors thrown during processing of response.success', async function() {
      const success = jest.fn();
      const fail = jest.fn(() => {
        throw new Error('test');
      });
      const c = new Crawler('', new DummyDriver());
      c.on('setup', (c: Crawler) => c.enqueue({url: 'http://example.com/fail', shouldFail: true}))
      c.on('response.error', fail);
      c.on('response.success', success);
      await expect(c.crawl()).rejects.toEqual('An error was caught during processing of a failure result: Error: test');
      expect(success.mock.calls.length).toEqual(0);
    })
  });

  describe('Analyze', function() {
    it('Should invoke analyze event', function() {
      var cb = jest.fn();
      var c = new Crawler('');
      c.on('analyze', cb);
      return c.analyze({name: 'test', date: new Date(), data: []});
    });

    it('Should return a report from analyze', function() {
      var c = new Crawler('');
      return c.analyze({name: 'test', date: new Date(), data: []}).then(report => {
        expect(report).toBeInstanceOf(Analysis);
      });
    });
  });
});
