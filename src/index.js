// @flow
var crawler = require('./crawler');
crawler.drivers = {
  request: require('./driver/request')
};
crawler.metrics = require('./metrics');

module.exports = crawler;
