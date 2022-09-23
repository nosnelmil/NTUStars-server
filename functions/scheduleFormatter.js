module.exports.formatData = function (rawScheduleData) {
  var formattedSchedule = {}
  for (var courseCode in rawScheduleData) {
    formattedSchedule[courseCode] = {}
    var currentIndex
    rawScheduleData[courseCode].forEach(row => {
      // Check if have index
      if (row[0]) {  // There is an index
        currentIndex = row[0]
        // initial free days
        var initialFreeDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
        // create new entry for coursecode
        formattedSchedule[courseCode][currentIndex] = {
          type: [row[1]],
          group: [row[2]],
          day: [row[3]],
          time: [timeToIndexedTime(row[4])],
          venue: [row[5]],
          remarks: [remarksToWeekNums(row[6])],
          freeDays: [...updateFreeDays(initialFreeDays, row[3])]
        }
      } else { // no index
        formattedSchedule[courseCode][currentIndex].type.push(row[1])
        formattedSchedule[courseCode][currentIndex].group.push(row[2])
        formattedSchedule[courseCode][currentIndex].day.push(row[3])
        formattedSchedule[courseCode][currentIndex].time.push(timeToIndexedTime(row[4]))
        formattedSchedule[courseCode][currentIndex].venue.push(row[5])
        formattedSchedule[courseCode][currentIndex].remarks.push(remarksToWeekNums(row[6]))
        const currentFreedays = formattedSchedule[courseCode][currentIndex].freeDays
        formattedSchedule[courseCode][currentIndex].freeDays = [...updateFreeDays(currentFreedays, row[3])]
      }
    })
  }
  return formattedSchedule
}

/**
* Converts time from scraped data to an number representing its position in a formattedSchedule
* 0: 0800-0830
* 1: 0830-0900 ...
* @param {String} rawTime - scraped data format eg. above
*/
function timeToIndexedTime (rawTime) {
  if(!rawTime){
    return
  }
  const timeDict = {
    "0800": 0,
    "0830": 1,
    "0900": 2,
    "0930": 3,
    "1000": 4,
    "1030": 5,
    "1100": 6,
    "1130": 7,
    "1200": 8,
    "1230": 9,
    "1300": 10,
    "1330": 11,
    "1400": 12,
    "1430": 13,
    "1500": 14,
    "1530": 15,
    "1600": 16,
    "1630": 17,
    "1700": 18,
    "1730": 19,
    "1800": 20,
    "1830": 21,
    "1900": 22,
    "1930": 23,
    "2000": 24,
    "2030": 25,
    "2100": 26,
    "2130": 27,
    "2200": 28,
    "2230": 29,
    "2300": 30,
    "2330": 31,
  }
  var timeArray = rawTime.split("-")
  const startIndex = timeDict[timeArray[0]]
  //change the 3rd digit of time to 3 if its 2 eg. 1720 to 1730
  console.log("test", timeArray)
  if (timeArray[1][2] == '2') {
    timeArray[1] = timeArray[1].slice(0, 2).concat('30')
  }else if (timeArray[1][2] == '5') {
    const increasedHour = parseInt(timeArray[1].slice(1,2)) + 1
    timeArray[1] = timeArray[1].slice(0, 1).concat(`${increasedHour}00`)
    console.log('test', timeArray[1])
  }

  const EndIndex = timeDict[timeArray[1]] - 1 //it ends at the previous time index hence minus 1

  const arrayLength = EndIndex - startIndex + 1
  // python range() in javascript
  var timeIndex = [...Array(arrayLength).keys()].map(value => value + startIndex)
  return timeIndex
}

/**
* Converts remarks to week numbers
* @param {String} rawRemarks - any value in the remarks column
*/
function remarksToWeekNums (rawRemark) {
  var weeks = []
  const indexOfW = rawRemark.search('Wk')
  // If remarks even contains Wk
  if (indexOfW != -1) {
    // shift index to first number
    var currentIndex = indexOfW + 2
    // flag when index is more than length of remark
    var outOfScope = false
    const maxLength = rawRemark.length
    // variables and flag for weeks if week format is a range
    var currentWeekNum = 0
    var startWeekRange = 0
    var isRange = false

    while (!currentIndex >= maxLength || !outOfScope) {
      var currentChar = rawRemark[currentIndex]
      let nextChar
      if (currentIndex + 1 == maxLength) {
        // some random char when there is no next char
        nextChar = 'x'
        outOfScope = true
      } else {
        nextChar = rawRemark[currentIndex + 1]
      }
      if (parseInt(currentChar) || parseInt(currentChar) == 0) { // 0 is a falsy
        // next char is a num or not
        if (parseInt(nextChar) || parseInt(nextChar) == 0) {
          // shift current digit to tens place
          currentWeekNum = parseInt(currentChar) * 10
          currentIndex++
          continue
        } else {
          currentWeekNum += parseInt(currentChar)
        }
        // check if next char is - if not can add num to weeks array
        if (nextChar == '-') {
          isRange = true
          startWeekRange = currentWeekNum
          currentWeekNum = 0

        } else if (isRange) {
          const arrayLength = currentWeekNum - startWeekRange + 1
          weeks = weeks.concat([...Array(arrayLength).keys()].map(value => value + startWeekRange))
          // reset flags and vars
          isRange = false
          startWeekRange = 0
          currentWeekNum = 0
        } else {
          weeks.push(currentWeekNum)
          currentWeekNum = 0
        }
      }
      currentIndex++
    }
    return weeks
  } else {
    return [...Array(13).keys()].map(value => value + 1)
  }
}

function updateFreeDays(freeDays, notFreeDay){
  if(notFreeDay.length === 0){
    return freeDays
  }
  let result = [...freeDays]
  const indexOfNotFreeDay = freeDays.findIndex((freeday) => freeday === notFreeDay)
  if(indexOfNotFreeDay != -1){
    result.splice(indexOfNotFreeDay,1)
  } 
  return result
}