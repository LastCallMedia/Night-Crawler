function status(response) {
  return {
    status: response.statusCode
  };
}

function time(response) {
  return {
    time: response.timingPhases.firstByte
  };
}

module.exports = {
  status,
  time
};
