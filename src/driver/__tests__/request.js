import RequestDriver from '../request';
import nock from 'nock';

describe('Request Driver', function() {
  it('Should return a response for a crawlRequest', function() {
    nock('http://www.example.com')
      .get('/')
      .reply(201);

    return new RequestDriver()
      .fetch({ url: 'http://www.example.com' })
      .then(function(res) {
        expect(res.statusCode).toEqual(201);
      });
  });

  it('Should reply with the response even if it is a 500', function() {
    nock('http://www.example.com')
      .get('/')
      .reply(500);

    return new RequestDriver()
      .fetch({ url: 'http://www.example.com' })
      .then(function(res) {
        expect(res.statusCode).toEqual(500);
      });
  });

  it('Should copy status code and backendTime to the collected data', function() {
    nock('http://www.example.com')
      .get('/')
      .reply(200);

    var d = new RequestDriver();
    return d.fetch({ url: 'http://www.example.com' }).then(function(res) {
      var collected = d.collect(res);
      expect(typeof collected.statusCode).toEqual('number');
      expect(typeof collected.backendTime).toEqual('number');
    });
  });

  it('Should throw an error in the event of a network issue', function() {
    nock('http://www.example.com')
      .get('/')
      .replyWithError({ code: 'ETIMEDOUT' });

    let called = 0;
    var d = new RequestDriver();
    return d
      .fetch({ url: 'http://www.example.com' })
      .catch(function(err) {
        called++;
        expect(err.error.code).toEqual('ETIMEDOUT');
      })
      .then(function() {
        expect(called).toEqual(1);
      });
  });

  it('Should allow request configuration, including authentication', function() {
    nock('http://www.example.com')
      .get('/')
      .basicAuth({
        user: 'john',
        pass: 'doe'
      })
      .reply(200);

    return new RequestDriver({ auth: { user: 'john', pass: 'doe' } })
      .fetch({ url: 'http://www.example.com' })
      .then(function(res) {
        expect(res.statusCode).toEqual(200);
      });
  });
});
