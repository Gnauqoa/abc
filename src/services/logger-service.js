function init() {}

function log(message, info) {
  let data = message;
  if (typeof info !== "undefined") {
    data = data + ": " + JSON.stringify(info);
  }
  console.log(data);
}

function error(message, err) {
  let data = message;
  if (typeof err !== "undefined") {
    data = data + ": " + JSON.stringify(err);
  }
  console.error(data);
}

export default {
  init,
  log,
  error,
};
