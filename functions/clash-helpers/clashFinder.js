// takes in an array to find if there is any clash
module.exports.clashFinder = function (combination) {
  // comparison priority: 
  // day
  // time
  // week
  var clashes = []
  // check day
  for (var i = 0; i < combination.length - 1; i++) {
    var current = combination[i]
    for (var j = i + 1; j < combination.length; j++) {
      var comparisonTarget = combination[j]
      var daysClashed = Array1DClashFinder(current.day, comparisonTarget.day)

      if (!!daysClashed.length) {
        var timingAndDayClashed = daysClashed.filter(pair => Array1DClashFinder(current.time[pair[0]], comparisonTarget.time[pair[1]], false))

        if (!!timingAndDayClashed.length) {
          var fullyClashed = timingAndDayClashed.filter(pair => Array1DClashFinder(current.remarks[pair[0]], comparisonTarget.remarks[pair[1]], false))
          clashes = clashes.concat(fullyClashed)
          return true
        }
      }
    }
  }
  return false
}
// returns array of index pairs which clash
function Array1DClashFinder (arr1, arr2, fullSearch = true) {
  var obj = {}
  var clashes = []
  arr1.forEach((element, index) => obj[element] ? obj[element] = [...obj[element], index] : obj[element] = [index])
  for (var i = 0; i < arr2.length; i++) {
    var element = arr2[i]
    if (obj[element]) {
      if (fullSearch) {
        // add clashed pair
        obj[element].forEach(clash => {
          clashes.push([clash, i])
        })
      } else {
        return true
      }
    }
  }
  return fullSearch ? clashes : false
}
