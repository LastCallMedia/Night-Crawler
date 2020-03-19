import { Driver } from '../types';
import https from 'https';
import http from 'http';
import { URL } from 'url';
import { performance } from 'perf_hooks';

interface NativeDriverResponse extends http.IncomingMessage {
  statusCode: number;
  time: number;
}

function _getDriver(url: URL): typeof http | typeof https {
  switch (url.protocol) {
    case 'https:':
      return https;
    case 'http:':
      return http;
    default:
      throw new Error('Unknown protocol: ' + url.protocol);
  }
}

const native: Driver<NativeDriverResponse> = (url, options: {} = {}) => {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const theseOptions = Object.assign(
      {
        protocol: parsed.protocol,
        host: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname,
        method: 'GET',
        timeout: 15000
      },
      options
    );
    const start = performance.now();
    const req = _getDriver(parsed).request(theseOptions, response => {
      resolve(
        Object.assign(response, {
          time: performance.now() - start,
          statusCode: response.statusCode ?? 0
        })
      );
    });
    req.on('timeout', () => {
      req.abort();
    });
    req.on('error', reject);
    req.end();
  });
};

export default native;
