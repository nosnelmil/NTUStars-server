const {warn} = require("firebase-functions/logger");

module.exports.validateRequest = function(reqBody) {
  if (!("courseCode" in reqBody) ||
      !("semester" in reqBody) ||
      !reqBody["courseCode"].length == 6) {
    warn("User bad request for get-schedule");
    return false;
  }
};
