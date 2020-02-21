// @flow
import Crawler from './crawler';
import RequestDriver from './driver/request';
import { Number, Milliseconds, Percent } from './metrics';

Crawler.drivers = {
  request: RequestDriver
};
Crawler.metrics = {
  Number,
  Milliseconds,
  Percent
};

export default Crawler
