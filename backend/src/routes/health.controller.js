const { sendSuccess } = require("../shared/response/apiResponse");

function check(_req, res) {
  return sendSuccess(res, {
    message: "OK",
    data: {
      status: "ok",
    },
  });
}

module.exports = {
  check,
};
