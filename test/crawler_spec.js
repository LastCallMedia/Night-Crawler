var Crawler = require('../src/crawler');
var nock = require('nock');

describe('Crawler', () => {
  it('Should return an array of results from crawling', function() {
    return new Crawler().crawl().then(res => expect(res).toEqual([]));
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

  it('Should normalize requests that are added to the queue', function() {
    var tests = ['foo', { url: 'foo' }, { url: 'foo', groups: [] }];
    tests.forEach(function(t) {
      var c = new Crawler().enqueue(t);
      expect(c.queue).toEqual([
        {
          url: 'foo',
          groups: []
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
        .then(data => {
          expect(data.length).toEqual(2);
          expect(data[0]).toEqual({
            url: 'http://example.com/fail',
            error: true,
            groups: []
          });
          expect(data[1]).toEqual({
            url: 'http://example.com/success',
            error: false,
            groups: []
          });
        });
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
        .then(data => expect(data[0].touched).toEqual(1));
    });
  });
});
