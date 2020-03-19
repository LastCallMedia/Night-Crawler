
const {crawl, test, after} = require('lastcall-nightcrawler');
const expect = require('expect');

module.exports = crawl('Homepage', function() {
    const times = [];

    // Tests run for every request/response cycle.
    test('Status code is 2xx', function(unit) {
       expect(unit.response.statusCode).toBeGreaterThanOrEqual(200);
       expect(unit.response.statusCode).toBeLessThan(300);
    });

    test('Has a long cache lifetime', function(unit) {
        expect(unit.response.headers).toHaveProperty('cache-control', 'max-age=604800');
    })

    test('Collect response time', function(unit) {
        times.push(unit.response.time);
    })

    // After functions run after all responses have been received.
    after('Average response time should be < 200ms', function() {
        const sum = times.reduce((total, value) => total + value, 0);
        expect(sum / times.length).toBeLessThan(200);
    })

    // Return any iterable/async iterable filled with request-shaped objects.
    return [
        // options can be used to pass options to the driver.
        // For example, passing {auth: 'foo:bar'} will enable basic auth.
        {url: 'https://www.example.com/', options: {}}
    ]
})
