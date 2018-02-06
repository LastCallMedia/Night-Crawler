
function no500s(results) {
    return results.filter(r => parseInt(r.data.status) >= 500).length === 0;
}
no500s.displayName = 'No 500 Responses';

function fasterThan5s(results) {
    return results.filter(r => parseInt(r.data.time) > 5000).length === 0;
}
fasterThan5s.displayName = 'No responses slower than 5s';

module.exports = {
    no500s,
    fasterThan5s
}