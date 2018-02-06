function noErrors(results) {
  return results.filter(r => r.error).length === 0;
}
noErrors.displayName = 'No Errors';

function fasterThan5s(results) {
  return results.filter(r => parseInt(r.backendTime) > 5000).length === 0;
}
fasterThan5s.displayName = 'No responses slower than 5s';

module.exports = {
  noErrors,
  fasterThan5s
};
