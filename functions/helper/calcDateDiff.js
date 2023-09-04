module.exports.calcDateDiff = function(date1, date2) {
  if (typeof date1.getMonth === "function" && typeof date2.getMonth === "function") {
    const diffTime = Math.abs(date2 - date1);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  } else {
    return 1;
  }
};
