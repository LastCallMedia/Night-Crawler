
const CrawlerExport = require('../index');

describe('Index File', function() {
    it('Should export a crawler', function() {
        expect(typeof CrawlerExport).toEqual('function')
    })
    it('Should attach drivers as an object on the crawler', function() {
        expect(typeof CrawlerExport.drivers.request).toBe('function')
    })
    it('Should attach metrics as an object on the crawler', function() {
        expect(typeof CrawlerExport.metrics.Number).toBe('function')
        expect(typeof CrawlerExport.metrics.Milliseconds).toBe('function')
        expect(typeof CrawlerExport.metrics.Percent).toBe('function')
    })
})