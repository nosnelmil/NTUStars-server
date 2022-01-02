module.exports.generateScheduleCombinations = function (formattedData) {
  var combinationResults = [];
  const courseCodeKeys = Object.keys(formattedData);
  const courseCodeKeysLength = courseCodeKeys.length;
  function helper (array, i) {
    const indexKeys = Object.keys(formattedData[courseCodeKeys[i]]);
    for (var j = 0; j < indexKeys.length; j++) {
      // copy array
      var result = array.slice(0);
      result.push({
        index: indexKeys[j],
        ...formattedData[courseCodeKeys[i]][indexKeys[j]]
      });
      if (i != courseCodeKeysLength - 1) {
        // not at last coursecode
        helper(result, i + 1);
      } else {
        combinationResults.push({
          id: `${result[0].index + result[1].index + result[2].index}`,
          data: result
        });
      }
    }
  }
  helper([], 0);
  return combinationResults
}