Setup for a new Repository with Nightcrawler
=====================


## Install this package using NPM or Yarn:
```bash
yarn add lastcall-nightcrawler
```

## Define your crawler by creating a `nightcrawler.js` file in the root directory, like this:
```js
const Crawler = require('lastcall-nightcrawler');
const Number  = Crawler.metrics.Number;
const Milliseconds = Crawler.metrics.Milliseconds;
const Percent = Crawler.metrics.Percent;

const myCrawler = new Crawler('My Crawler');

// Use a base and urls from json file.
// Location of the json file being used.
const pages = require('./page');
const environments = require('./environment');

function parseOpt(optname, defaultValue = undefined) {
  const matches = process.argv.filter(arg => arg.indexOf(`--${optname}=`) === 0);
  return matches.length ? matches[0].replace(`--${optname}=`, '') : defaultValue
}

// Determine the proper environment to point at.
const target = parseOpt('target', 'local');
let environment;
if(target in environments) {
  environment = environments[target];
}
// Detect appserver URL from LANDO_INFO if possible.
else if(target === 'local' && process.env.LANDO_INFO) {
  const info = JSON.parse(process.env.LANDO_INFO);
  if(info.appserver_nginx && info.appserver_nginx.urls.length > 0) {
    const url = info.appserver_nginx.urls.pop();
    environment = {name: "Local", url: url}
  }
  else if(info.appserver && info.appserver.urls.length > 0) {
    const url = info.appserver.urls.pop();
    environment = {name: "Local", url: url}
  }
}
else if(target.match(/^http:/)) {
  environment = {name: 'Local', url: target}
}
else {
  throw new Error(`--target flag must be set to a known environment or a URL. ${target} is not known.`)
}

myCrawler.on('setup', function(crawler) {
  // On setup, give the crawler a list of URLs to crawl by combining the
  // page URLs with the base URL.
  pages.forEach(page => crawler.enqueue(`${environment.url}${page.url}`))
});

// Collect additional data about each response.
myCrawler.on('response.success', function (response, data) {
  data.statusMessage = response.statusMessage;
});

/**
 * Analyze the data once it's been collected.
 */
myCrawler.on('analyze', function (crawlReport, analysis) {
  // On analysis, derive the metrics you need from the
  // array of collected data.
  var data = crawlReport.data;

  // Calculate the number of requests that were made:
  analysis.addMetric('count', new Number('Total Requests', 0, data.length));

  // Calculate the average response time:
  var avgTime = data.reduce(function (sum, dataPoint) {
    return sum + dataPoint.backendTime
  }, 0) / data.length;
  analysis.addMetric('time', new Milliseconds('Avg Response Time', 0, avgTime));

  // Calculate the percent of requests that were marked failed:
  var failRatio = data.filter(function (dataPoint) {
    return dataPoint.fail === true;
  }).length / data.length;
  var level = failRatio > 0 ? 2 : 0;
  analysis.addMetric('fail', new Percent('% Failed', level, failRatio));

  // Calculate the percent of requests that resulted in a 500 response.
  var serverErrorRatio = data.filter(function (dataPoint) {
    return dataPoint.statusCode >= 500;
  }).length / data.length;
  var level = serverErrorRatio > 0 ? 2 : 0;
  analysis.addMetric('500', new Percent('% 500', level, serverErrorRatio));

  data.forEach(function(request) {
    var level = request.statusCode > 499 ? 2 : 0
    analysis.addResult(request.url, level)
  });
});

module.exports = myCrawler;
```

## Adding `environment.json` and `page.json` to the repository (if needed)
Next step would be to create the following files: `environment.json` and `page.json` in the root directory.
If you have already created those files for BackstopJS skip this step.


### `environment.json`
If you have not created a `environment.json` file yet add the following information to the `environment.json` file:

```$xslt
{
  "local": {
    "url": "http://drupal:80",
    "name": "Local"
  }
  "prod": {
    "url": "https://www.example.com",
    "name": "Production"
  }
  "test": {
    "url": "https://www.example.com",
    "name": "Test"
  }
      
}
```   
If you are using lando.yml remove the `local` from the `environment.json` file it's not needed.

### `page.json`
If you have not created a `page.json` file yet add the following information to the `page.json` file:

```$xslt
[
  {"label": "Homepage", "url": "/"},
  {"label":  "ExampleSelector", "url":  "/",
    "backstopSelectors": [
      ".nav-header",
      "document"
    ]
  }
]
```
You will notice a `backstopsSelectors` in the snippet. If this page.json is only being used for Nightcrawler you
will on need the following: `{"label": "Homepage", "url": "/"},` for each page URL you want to test with Nightcrawler. 
Those same page URLs can be used with BackstopJS.

If it's a Drupal site you can use the following fetch URLs with Drush. Example would be [Openmass Nightcrawler](https://github.com/massgov/openmass/blob/develop/.circleci/nightcrawler/fetch_urls.js). 
It would include adjusting some of the Nightcrawler.js script with samples and to run the query with Nightcrawler.
