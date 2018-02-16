import Crawler from '../src/crawler';
import Analysis from '../src/analysis';

var nock = require('nock');

describe('Crawler', () => {
  it('Should return an object containing the results of the crawl', function() {
    return new Crawler().crawl().then(report => {
      expect(report).toBeInstanceOf(Object);
      expect(report.date).toBeInstanceOf(Date);
      expect(report.data).toEqual([]);
    });
  });

  it('Should invoke the setup event at the start of crawling', function() {
    var cb = jest.fn();
    var c = new Crawler();
    return c
      .on('setup', cb)
      .crawl()
      .then(() => {
        // Asserts called 1x, with crawler as arg.
        expect(cb.mock.calls).toEqual([[c]]);
      });
  });

  describe('Enqueue', function() {
    it('Should normalize requests that are added to the queue', function() {
      var tests = ['foo', { url: 'foo' }];
      tests.forEach(function(t) {
        var c = new Crawler().enqueue(t);
        expect(c.queue).toEqual([
          {
            url: 'foo'
          }
        ]);
      });
    });

    it('Should accept additional data that is enqueued', function() {
      var c = new Crawler().enqueue({ url: 'foo', foo: 'bar' });
      expect(c.queue).toEqual([
        {
          url: 'foo',
          foo: 'bar'
        }
      ]);
    });
  });

  describe('Crawling', function() {
    it('Should should invoke success callback with the appropriate arguments', function() {
      nock('http://example.com')
        .get('/success')
        .reply(201);
      var called = 0;
      return new Crawler()
        .on('setup', c => c.enqueue('http://example.com/success'))
        .on('response', function(response, data) {
          expect(response.statusCode).toEqual(201);
          expect(data.url).toEqual('http://example.com/success');
          called++;
        })
        .crawl()
        .then(() => expect(called).toEqual(1));
    });

    it('Should invoke failure callback with the appropriate arguments', function() {
      nock('http://example.com')
        .get('/fail')
        .reply(500);
      var called = 0;
      return new Crawler()
        .on('setup', c => c.enqueue('http://example.com/fail'))
        .on('response', function(response, data) {
          expect(response.statusCode).toEqual(500);
          expect(data.url).toEqual('http://example.com/fail');
          called++;
        })
        .crawl()
        .then(() => expect(called).toEqual(1));
    });

    it('Should return an array of collected data about responses', function() {
      var n = nock('http://example.com');
      n.get('/fail').reply(500);
      n.get('/success').reply(200);
      return new Crawler()
        .on('setup', c => {
          c.enqueue('http://example.com/fail');
          c.enqueue('http://example.com/success');
        })
        .crawl()
        .then(({ data }) => {
          expect(data.length).toEqual(2);
          expect(data[0].url).toEqual('http://example.com/fail');
          expect(data[1].url).toEqual('http://example.com/success');
          expect(data[0].error).toEqual(true);
          expect(data[1].error).toEqual(false);
          expect(typeof data[0].statusCode).toEqual('number');
          expect(typeof data[1].statusCode).toEqual('number');
          expect(typeof data[0].backendTime).toEqual('number');
          expect(typeof data[1].backendTime).toEqual('number');
        });
    });

    it('Should pass additional data that was queued', function() {
      nock('http://example.com')
        .get('/success')
        .reply(200);
      return new Crawler()
        .on('setup', c =>
          c.enqueue({ url: 'http://example.com/success', foo: 'bar' })
        )
        .crawl()
        .then(({ data }) => expect(data[0].foo).toEqual('bar'));
    });

    it('Should collect data added through the response event', function() {
      nock('http://example.com')
        .get('/success')
        .reply(200);
      return new Crawler()
        .on('setup', c => c.enqueue('http://example.com/success'))
        .on('response', function(response, data) {
          data.touched = 1;
        })
        .crawl()
        .then(({ data }) => expect(data[0].touched).toEqual(1));
    });
  });

  describe('Analyze', function() {
    it('Should invoke analyze event', function() {
      var cb = jest.fn();
      var c = new Crawler();
      c.on('analyze', cb);
      return c.analyze([]);
    });

    it('Should return a report from analyze', function() {
      var c = new Crawler();
      return c.analyze([]).then(report => {
        expect(report).toBeInstanceOf(Analysis);
      });
    });
  });
});
