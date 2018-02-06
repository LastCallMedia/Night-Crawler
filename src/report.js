class CrawlReport {
  constructor(crawlResponses) {
    this.crawlResponses = crawlResponses;
  }

  /**
   * Get a list of all discrete groups in the report.
   *
   * @returns {*}
   */
  getGroups() {
    return this.crawlResponses
      .reduce(function(groups, crawlResponse) {
        return groups.concat(crawlResponse.groups);
      }, [])
      .filter((el, pos, arr) => {
        return arr.indexOf(el) === pos;
      });
  }

  /**
   * Get all the responses in this report that are in a given group.
   *
   * @param group
   * @returns {Array.<T>}
   */
  getGroup(group) {
    return this.crawlResponses.filter(r => r.groups.indexOf(group) !== -1);
  }
}

module.exports = CrawlReport;
