import nock from 'nock';
import NativeDriver from '../native';

describe('Native Driver', function() {
  it('Should throw an error for invalid schemes', async function() {
    await expect(
      new NativeDriver().fetch({ url: 'foo://bar' })
    ).rejects.toThrow('Unknown protocol: foo:');
  });

  it('Should return a response for an HTTP crawlRequest', function() {
    nock('http://www.example.com')
      .get('/')
      .reply(201);

    return new NativeDriver()
      .fetch({ url: 'http://www.example.com' })
      .then(function(res) {
        expect(res.statusCode).toEqual(201);
      });
  });
  it('Should return a response for an HTTPS crawlRequest', function() {
    nock('https://www.example.com')
      .get('/')
      .reply(201);

    return new NativeDriver()
      .fetch({ url: 'https://www.example.com' })
      .then(function(res) {
        expect(res.statusCode).toEqual(201);
      });
  });

  it('Should reply with the response even if it is a 500', function() {
    nock('http://www.example.com')
      .get('/')
      .reply(500);

    return new NativeDriver()
      .fetch({ url: 'http://www.example.com' })
      .then(function(res) {
        expect(res.statusCode).toEqual(500);
      });
  });

  it('Should copy status code and backendTime to the collected data', function() {
    nock('http://www.example.com')
      .get('/')
      .reply(200);

    const d = new NativeDriver();
    return d.fetch({ url: 'http://www.example.com' }).then(function(res) {
      const collected = d.collect(res);
      expect(typeof collected.statusCode).toEqual('number');
      expect(typeof collected.backendTime).toEqual('number');
    });
  });

  it('Should throw an error in the event of a network issue', function() {
    nock('http://www.example.com')
      .get('/')
      .replyWithError({ code: 'ETIMEDOUT' });

    let called = 0;
    const d = new NativeDriver();
    return d
      .fetch({ url: 'http://www.example.com' })
      .catch(function(err) {
        called++;
        expect(err.code).toEqual('ETIMEDOUT');
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

    return new NativeDriver({ auth: 'john:doe' })
      .fetch({ url: 'http://www.example.com' })
      .then(function(res) {
        expect(res.statusCode).toEqual(200);
      });
  });
});
