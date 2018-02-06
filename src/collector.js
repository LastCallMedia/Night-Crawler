function statusCode(response, data) {
  data.statusCode = response.statusCode;
}

function backendResponseTime(response, data) {
  data.backendTime = response.timingPhases.firstByte;
}

module.exports = {
  statusCode,
  backendResponseTime
};
