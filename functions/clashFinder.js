// takes in an array to find if there is any clash
module.exports.clashFinder = function(combination) {
  // comparison priority:
  // day
  // time
  // week
  let clashes = [];
  // check day
  for (let i = 0; i < combination.length - 1; i++) {
    const current = combination[i];
    for (let j = i + 1; j < combination.length; j++) {
      const comparisonTarget = combination[j];
      const daysClashed = array1DClashFinder(current.day, comparisonTarget.day);

      if (daysClashed.length) {
        const timingAndDayClashed = daysClashed.filter((pair) =>
          array1DClashFinder(current.time[pair[0]],
              comparisonTarget.time[pair[1]], false));

        if (timingAndDayClashed.length) {
          const fullyClashed = timingAndDayClashed.filter((pair) =>
            array1DClashFinder(current.remarks[pair[0]],
                comparisonTarget.remarks[pair[1]], false));
          clashes = clashes.concat(fullyClashed);
          return true;
        }
      }
    }
  }
  return false;
};
// returns array of index pairs which clash
function array1DClashFinder(arr1, arr2, fullSearch = true) {
  const obj = {};
  const clashes = [];
  arr1.forEach((element, index) =>
    obj[element] ?
    obj[element] = [...obj[element], index] :
    obj[element] = [index]);
  for (let i = 0; i < arr2.length; i++) {
    const element = arr2[i];
    if (obj[element]) {
      if (fullSearch) {
        // add clashed pair
        obj[element].forEach((clash) => {
          clashes.push([clash, i]);
        });
      } else {
        return true;
      }
    }
  }
  return fullSearch ? clashes : false;
}
