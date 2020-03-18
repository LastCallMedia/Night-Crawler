![Nightcrawler](docs/logo.png)
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
const {crawl, test} = require('./dist');
const expect = require('expect');

module.exports = crawl('Response code validation', function() {
  test('Should return 2xx', function(unit) {
    expect(unit.response.statusCode).toBeGreaterThanOrEqual(200);
    expect(unit.response.statusCode).toBeLessThan(300);
  });

  return [
    {url: 'https://example.com'},
    {url: 'https://example.com?q=1'},
    {url: 'https://example.com?q=2'}
  ];
});
```
Run your crawler:
```bash
# Run the crawler.
node_modules/.bin/nightcrawler crawl
```

Specifying what URLs to crawl
-----------------------------

The `crawl` function expects a return value of an iterable (or async iterable) containing "requests".  The simplest version of this is just an array of objects that have a `url` property.  Eg:
```js
module.exports = crawl('Crawl a static list of URLs', function() {

    return [
        {url: 'https://example.com'}
    ]
});
```

For more advanced use cases, you may want to use async generators to fetch a list of URLs from somewhere else (eg: a database).  Eg:

```js
async function* getURLs() {
    const result = await queryDB();
    for(const url of result) {
        yield {url: url};
    }
}

module.exports = crawl('Crawl a dynamic list of URLs', function() {

    return getURLs();
})
```

Performing assertions on responses
----------------------------------

One of the primary goals of Nightcrawler is to detect URLs that don't meet your expectations.  To achieve this, you can use the `test` function within a `crawl` to make assertions about the response received.

```js
const {crawl, test} = require('./dist');
// Use the expect module from NPM for assertions.
// You can use any assertion library, including the built-in assert module.
const expect = require('expect');

module.exports = crawl('Check that the homepage is cacheable', function() {
    
    test('Should have cache-control header', function(unit) {
        expect(unit.response.headers).toHaveProperty('cache-control');
        expect(unit.response.headers['cache-control']).toBe('public; max-age: 1800');
    })

    return [{url: 'https://example.com/'}]
});
```

The `test` function will receive a `unit` of crawler work, which includes the following properties:

* `request`: The request, as you passed it into the Crawler. This will include any additional properties you passed in, and you can use those properties to do conditional checking of units of work.
* `response`: The response object, as returned by the Driver.  The default `NativeDriver` will produce a response in the shape of a Node [`http.IncomingMessage`](https://nodejs.org/api/http.html#http_class_http_incomingmessage) object. All `response` objects are guaranteed to have both a `statusCode` and a `time` property.

Performing assertions about the overall status of the crawl
-----------------------------------------------------------

For some use cases, you will want make assertions about many requests.  For example, checking the average response type of all requests.  To do this, you may use the `after` function to perform assertions after all the URLs have been requested.  Just use the `test` function to collect the data you need from each request, then perform the final assertion in `after`:

```js
const {crawl, test, after} = require('./dist');
const expect = require('expect');

module.exports = crawl('Check that pages load quickly', function() {
    const times = [];

    test('Collect response time', function(unit) {
        times.push(unit.response.time);
    })
    
    after('Response time should be less than 500ms', function() {
        const sum = times.reduce((total, value) => total + value, 0);
        expect(sum / times.length).toBeLessThan(500);
    })

    return [{url: 'https://example.com/'}]
});
```

Drivers
-------

Right now, there is only one "Driver" available for making requests.  It uses Node's built-in `http` and `https` modules to issue HTTP requests to the target URL. In the future, we may have additional drivers available.

CI Setup
--------
To add Nightcrawler to CircleCI make sure to the following steps are done:

In the build job add the following command `run: {name: "Yarn install", command: "yarn install --pure-lockfile" }`

Within another job or on it own run the following command `- run: {name: 'Nightcrawler', command: 'node_modules/.bin/nightcrawler crawl --json /tmp/artifacts/results.json --junit /tmp/junit/crawler.xml'}`. This will actually run Nightcrawler in CircleCI and output the results in JSON and XML file in the artifacts directory.

Add the job to a workflow to have Nightcrawler run against that branch. 

Attribution/Thanks
------------------
This project is an independent effort of Last Call Media, but it was born out of a need discovered while working on the [Mass.gov](https://www.mass.gov) project.  In particular, we'd like to thank members of the Platform Support team: Ian Sholtys for coming up with arguably the best name in software, Youssef Riahi for serving as a sounding board and a source of ideas, and Jessie Biroscak for encouraging development. See how Nightcrawler is being used by [Mass.gov](https://github.com/massgov/openmass/tree/develop/.circleci/nightcrawler).
