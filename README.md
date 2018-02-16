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
const Number = require('./src/metrics').Number;

const myCrawler = new Crawler();

myCrawler.on('setup', function(crawler) {
   // On setup, give the crawler a list of URLs to crawl.
   crawler.enqueue('http://localhost/'); 
   crawler.enqueue('http://localhost/foo'); 
});

myCrawler.on('analyze', function(crawlReport, analysis) {
    // On analysis, derive the metrics you need from the
    // array of collected data.
    analysis.add('count', new Number('Total Requests', 0, crawlReport.data.length));
});

module.exports = myCrawler;
```
Run your crawler:
```bash
# Run the crawler and save the collected data to a file.
node_modules/.bin/nightcrawler run -o report.json
```

Queueing Requests
-----------------
Requests can be queued during the `setup` event.  You can queue a new request by calling the `enqueue()` method, using either a string (representing the URL) or an object containing a `url` property.  If you pass an object, you will have access to that object's properties later on during analysis.

```js
myCrawler.on('setup', function(crawler) {
   // This works
   crawler.enqueue('http://localhost/'); 
   // So does this:
   crawler.enqueue({
     url: 'http://localhost/foo',
     group: 'awesome'
   }); 
});

myCrawler.on('analyze', function(crawlReport, analysis) {
    var awesomeRequests = crawlReport.data.filter(function(point) {
        // *group property is only available if you added it during queuing.
        return point.group === 'awesome';
    });
    // Do additional analysis only on pages in the awesome group.
})
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

Analysis
--------
Once the crawl has been completed, you will probably want to analyze the data in some way.  Data analysis in Nightcrawler is intentionally loose - the crawler fires an `analyze` event with an array of collected data, and you are responsible for analyzing your own data.  Here are some examples of things you might do during analysis:
 
 ```js
const metrics = require('./src/metrics');
const Number = metrics.Number;
const Milliseconds = metrics.Milliseconds;
const Percent = metrics.Percent;

myCrawler.on('analyze', function(crawlReport, analysis) {
    var data = crawlReport.data;
    
    // Calculate the number of requests that were made:
    analysis.add('count', new Number('Total Requests', 0, data.length));
    
    // Calculate the average response time:
    var avgTime = data.reduce(function(sum, dataPoint) {
        return sum + dataPoint.backendTime
    }, 0) / data.length;
    analysis.add('time', new Milliseconds('Avg Response Time', 0, avgTime));
    
    // Calculate the percent of requests that were marked failed:
    var failRatio = data.filter(function(dataPoint) {
        return dataPoint.fail === true;
    }).length / data.length;
    var level = failRatio > 0 ? 2 : 0;
    analysis.add('fail', new Percent('% Failed', level, failRatio));
    
    // Calculate the percent of requests that resulted in a 500 response.
    var serverErrorRatio = data.filter(function(dataPoint) {
        return dataPoint.statusCode >= 500;
    }).length / data.length;
    var level = serverErrorRatio > 0 ? 2 : 0;
    analysis.add('500', new Percent('% 500', level, serverErrorRatio));
});
```
The [`analysis`](./src/analysis.js) object can consist of many metrics, added through the `add` method. See [`src/metrics.js`](./src/metrics.js) for more information about metrics. 