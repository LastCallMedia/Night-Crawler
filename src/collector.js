function statusCode(response, data) {
  data.statusCode = response.statusCode;
}

function backendTime(response, data) {
  data.backendTime = response.timingPhases.firstByte;
}

module.exports = {
  statusCode,
  backendTime
};
