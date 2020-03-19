import nock from 'nock';
import native from '../native';

describe('Native Driver', function() {
  it('Should throw an error for invalid schemes', async function() {
    await expect(native('foo://bar')).rejects.toThrow('Unknown protocol: foo:');
  });

  it('Should return a response for an HTTP crawlRequest', async function() {
    nock('http://www.example.com')
      .get('/')
      .reply(201);

    const response = await native('http://www.example.com');
    expect(response.statusCode).toEqual(201);
  });
  it('Should return a response for an HTTPS crawlRequest', async function() {
    nock('https://www.example.com')
      .get('/')
      .reply(201);

    const response = await native('https://www.example.com');
    expect(response.statusCode).toEqual(201);
  });

  it('Should reply with the response even if it is a 500', async function() {
    nock('http://www.example.com')
      .get('/')
      .reply(500);

    const response = await native('http://www.example.com');
    expect(response.statusCode).toEqual(500);
  });

  it('Should reply with the time the request took.', async function() {
    nock('http://www.example.com')
      .get('/')
      .reply(200);

    const response = await native('http://www.example.com');
    expect(response.time).toBeGreaterThan(0);
  });

  it('Should throw an error in the event of a network issue', async function() {
    nock('http://www.example.com')
      .get('/')
      .replyWithError({ code: 'ETIMEDOUT' });
    await expect(native('http://www.example.com')).rejects.toEqual({
      code: 'ETIMEDOUT'
    });
  });

  it('Should reject when the socket times out.', async function() {
    nock('https://www.example.com')
      .get('/')
      .socketDelay(500)
      .reply(200);
    await expect(
      native('https://www.example.com/', { timeout: 10 })
    ).rejects.toThrow('socket hang up');
  });

  it('Should reject when the request times out', async function() {
    nock('https://www.example.com')
      .get('/')
      .delay(500)
      .reply(200);

    await expect(
      native('https://www.example.com/', { timeout: 10 })
    ).rejects.toThrow('socket hang up');
  });

  it('Should require the headers to resolve before the timeout', async function() {
    nock('https://www.example.com')
      .get('/')
      .delay({ head: 500 })
      .reply(200);
    await expect(
      native('https://www.example.com/', { timeout: 10 })
    ).rejects.toThrow('socket hang up');
  });

  it('Should not require the body to resolve before the timeout', async function() {
    nock('https://www.example.com')
      .get('/')
      .delay({ body: 500 })
      .reply(200);
    await expect(
      native('https://www.example.com/', { timeout: 10 })
    ).resolves.toBeTruthy();
  });

  it('Should allow options to be overridden using driverOptions.', async function() {
    nock('http://www.example.com')
      .get('/')
      .basicAuth({
        user: 'john',
        pass: 'doe'
      })
      .reply(200);

    const response = await native('http://www.example.com/', {
      auth: 'john:doe'
    });
    expect(response.statusCode).toBe(200);
  });
});
