
function averageTime(collection) {
    return collection.reduce((sum, i) => sum + i.data.time, 0) / collection.length;
}
averageTime.displayName = 'Average Backend Time';

function percentSuccess(collection) {
    return collection.filter(i => i.data.status <= 500).length / collection.length * 100;
}
percentSuccess.displayName = '% Successful';

function totalRequests(collection) {
    return collection.length;
}
totalRequests.displayName = 'Total Requests';

module.exports = {
    averageTime,
    percentSuccess,
    totalRequests
}