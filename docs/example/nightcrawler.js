
const {crawl, test, after} = require('lastcall-nightcrawler');
const expect = require('expect');

module.exports = crawl('Homepage', function() {
    const times = [];

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

    after('Average response time should be < 200ms', function() {
        const sum = times.reduce((total, value) => total + value, 0);
        expect(sum / times.length).toBeLessThan(200);
    })

    return [
        {url: 'https://www.example.com/'}
    ]
})
