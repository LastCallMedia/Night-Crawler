import { Driver, CrawlRequest, DriverResponse } from '../types';
import https from 'https';
import http from 'http';
import { URL } from 'url';
import { performance } from 'perf_hooks';

function getDriver(protocol: string): typeof http | typeof https {
  switch (protocol) {
    case 'http:':
      return http;
    case 'https:':
      return https;
    default:
      throw new Error('Unknown protocol: ' + protocol);
  }
}
type Response = {
  statusCode: number | undefined;
  ttfb: number;
};

function request(
  url: string,
  options: https.RequestOptions
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const driver = getDriver(parsed.protocol);
    const theseOptions = Object.assign(
      {
        protocol: parsed.protocol.slice(0, -1),
        host: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname,
        method: 'GET'
      },
      options
    );

    const start = performance.now();
    const req = driver.request(theseOptions, res => {
      resolve({
        statusCode: res.statusCode,
        ttfb: performance.now() - start
      });
    });
    req.on('error', reject);
    req.end();
  });
}

export default class NativeDriver implements Driver {
  opts: https.RequestOptions;
  agent: http.Agent;
  constructor(opts: https.RequestOptions = {}) {
    this.opts = opts;
    this.agent = new http.Agent({ keepAlive: true });
  }

  fetch(req: CrawlRequest): Promise<DriverResponse> {
    return request(req.url, { ...this.opts, ...{ agent: this.agent } });
  }
  collect(response: DriverResponse): Record<string, unknown> {
    return {
      statusCode: response.statusCode,
      backendTime: response.ttfb
    };
  }
}
