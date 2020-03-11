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

  it('Should reply with the time the request took.', function() {
    nock('http://www.example.com')
      .get('/')
      .reply(200);

    return new NativeDriver()
      .fetch({ url: 'http://www.example.com' })
      .then(function(res) {
        expect(res.time).toBeGreaterThan(0);
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

  it('Should reject when the socket times out.', async function() {
    nock('https://www.example.com')
      .get('/')
      .socketDelay(500)
      .reply(200);
    const driver = new NativeDriver({ timeout: 10 });
    await expect(
      driver.fetch({ url: 'https://www.example.com/' })
    ).rejects.toThrowError('socket hang up');
  });

  it('Should reject when the request times out', async function() {
    nock('https://www.example.com')
      .get('/')
      .delay(500)
      .reply(200);
    const driver = new NativeDriver({ timeout: 10 });
    await expect(
      driver.fetch({ url: 'https://www.example.com/' })
    ).rejects.toBeTruthy();
  });

  it('Should require the headers to resolve before the timeout', async function() {
    nock('https://www.example.com')
      .get('/')
      .delay({ head: 500 })
      .reply(200);
    const driver = new NativeDriver({ timeout: 10 });
    await expect(
      driver.fetch({ url: 'https://www.example.com/' })
    ).rejects.toBeTruthy();
  });

  it('Should not require the body to resolve before the timeout', async function() {
    nock('https://www.example.com')
      .get('/')
      .delay({ body: 500 })
      .reply(200);
    const driver = new NativeDriver({ timeout: 10 });
    await expect(
      driver.fetch({ url: 'https://www.example.com/' })
    ).resolves.toBeTruthy();
  });
});
