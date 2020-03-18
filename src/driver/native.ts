import { Driver, CrawlerRequest } from '../types';
import https from 'https';
import http from 'http';
import { URL } from 'url';
import { performance } from 'perf_hooks';

interface NativeDriverResponse extends http.IncomingMessage {
  statusCode: number;
  time: number;
}

export default class NativeDriver implements Driver<NativeDriverResponse> {
  opts: https.RequestOptions;
  constructor(opts: https.RequestOptions = {}) {
    this.opts = opts;
  }

  fetch(crawlRequest: CrawlerRequest): Promise<NativeDriverResponse> {
    return new Promise((resolve, reject) => {
      const parsed = new URL(crawlRequest.url);
      const requestOpts = crawlRequest.driverOptions ?? {};
      const theseOptions = Object.assign(
        {
          protocol: parsed.protocol,
          host: parsed.hostname,
          port: parsed.port,
          path: parsed.pathname,
          method: 'GET',
          timeout: 15000
        },
        this.opts,
        requestOpts
      );
      const start = performance.now();
      const req = this._getDriver(parsed).request(theseOptions, res => {
        resolve(
          Object.assign(res, {
            time: performance.now() - start,
            statusCode: res.statusCode ?? 0
          })
        );
      });
      req.on('timeout', () => {
        req.abort();
      });
      req.on('error', reject);
      req.end();
    });
  }

  private _getDriver(url: URL): typeof http | typeof https {
    switch (url.protocol) {
      case 'https:':
        return https;
      case 'http:':
        return http;
      default:
        throw new Error('Unknown protocol: ' + url.protocol);
    }
  }
}
