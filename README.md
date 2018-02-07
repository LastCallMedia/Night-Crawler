Nightcrawler
============

Nightcrawler is a simple NodeJS webcrawler that fetches URLs and aggregates data about the responses it receives.  It is designed to support daily metric collection and assertions about those metrics for websites.  The canonical use case is in testing a development version of a website for errors and backend response time on a nightly basis.

Getting Started
---------------
Install this package using NPM or Yarn:
```bash
yarn add lastcall-nightcrawler
```
Define your crawler by creating a `nightcrawler.js` file, like this:
```js
# nightcrawler.js
const Crawler = require('./src/crawler');

const myCrawler = new Crawler();

myCrawler.on('setup', function(crawler) {
   // On setup, give the crawler a list of URLs to crawl.
   crawler.enqueue('http://localhost/'); 
   crawler.enqueue('http://localhost/foo'); 
});

myCrawler.on('analyze', function(data) {
    // On analysis, derive the metrics you need from the
    // array of collected data.
    var count = data.length;
    var avgTime = data.reduce(function(sum, dataPoint) {
        return sum + dataPoint.backendTime
    }, 0) / data.length;
    var failRatio = data.filter(function(dataPoint) {
        return dataPoint.fail === true;
    }).length / data.length;
    
    console.log('Crawled: ' + count);
    console.log('Average response: ' + Math.round(avgTime) + 'ms');
    console.log('Percent failed: ' + (Math.round(failRatio) * 100) + '%');
});

module.exports = myCrawler;
```
Run your crawler:
```bash
# Run the crawler and save the collected data to a file.
node_modules/.bin/nightcrawler run -o report.json
```

Collecting data
---------------
By default, only the following information is collected for each response:
* `url` (string) : The URL that was crawled.
* `error` (bool) : Whether the response was determined to be an error response.
* `status` (int): The HTTP status code received.
* `backendResponseTime` (int): The duration of HTTP server response (see the [request module's documentation](https://github.com/request/request) on `timingPhases.firstByte`).

If there is other data you're interested in knowing, you can collect it like this:
```js
// Collect the `Expires` header for each request.
myCrawler.on('response', function(response, data) {
   data.expires = response.headers['expires']; 
});
```
The response event is triggered on request success or error, as long as the server sends a response.  Anything put into the `data` object will end up in the final JSON report.


Dynamic Crawling
----------------
You may wish to be able to crawl a list of URLs that isn't static (it's determined at runtime).  For example, you may want to query a remote API or a database and enqueue a list of URLs based on that data. To support this, the `setup` event allows you to return a promise.

```js
// Fetch a list of URLs from a remote API, then enqueue them all.
myCrawler.on('setup', function(crawler) {
    return fetchData().then(function(myData) {
        myData.forEach(function(url) {
            crawler.enqueue(url);
        })
    })
})
```