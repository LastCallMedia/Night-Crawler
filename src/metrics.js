function averageTime(collection) {
  let timed = collection.filter(i => i.hasOwnProperty('backendTime'));

  if (timed.length) {
    return timed.reduce((s, i) => s + i.backendTime, 0) / timed.length;
  }
  return 0;
}
averageTime.displayName = 'Average Backend Time';

function percentSuccess(collection) {
  return (
    collection.filter(i => i.error === false).length / collection.length * 100
  );
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
};
