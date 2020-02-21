// @flow

import request from 'request';
import requestP from 'request-promise';
import { CrawlRequest, Driver } from '../types';

const defaultConfig = {
  forever: true // Use keepalive for faster reconnects.
};

export default class RequestDriver implements Driver {
  requestConfig: Object;

  /**
   * An array of request options to merge in with every request.
   *
   * @see https://github.com/request/request
   *
   * @param Object config
   */
  constructor(config: Object = defaultConfig) {
    this.requestConfig = config;
  }

  /**
   * Execute a single request.
   *
   * @param CrawlRequest req
   * @return {*}
   */
  fetch(req: CrawlRequest): Promise<request.Response> {
    return requestP(
      Object.assign({}, this.requestConfig, {
        // These properties are not overrideable.
        uri: req.url,
        time: true,
        resolveWithFullResponse: true,
        simple: false // Do not throw an error on 404/etc.
      })
    ).promise();
  }

  /**
   * Collect data about the response.
   *
   * @param Object res
   * @return {{statusCode: (*|number|statusCode), backendTime: *}}
   */
  collect(res: request.Response): {statusCode: number, backendTime: number} {
    return {
      statusCode: res.statusCode,
      backendTime: res.timingPhases!.firstByte
    };
  }
}
