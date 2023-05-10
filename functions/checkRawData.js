module.exports.checkRawData = function(rawData) {
  const objKeys = Object.keys(rawData);
  let error = false;
  objKeys.forEach((key) => {
    const rawCourseData = rawData[key];
    if (rawCourseData.length === 0) {
      error = key;
    }
  });
  return error;
};
