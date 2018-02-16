// @flow
import type { ResponseObj, CrawlResponse } from './crawler';

export function statusCode(response: ResponseObj, data: CrawlResponse) {
  data.statusCode = response.statusCode;
}

export function backendTime(response: ResponseObj, data: CrawlResponse) {
  data.backendTime = response.timingPhases.firstByte;
}
