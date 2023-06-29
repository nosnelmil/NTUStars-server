module.exports.formatScheduleData = function(rawScheduleData) {
  // schedule schema
  // schedule
  // // {index}
  // // // 0
  // // // // type = String
  // // // // group = String
  // // // // day = String
  // // // // time = Array
  // // // // venue = String
  // // // // weeks = Array
  // // // 1
  // ...
  const formattedSchedule = {};
  let currentIndex;
  for ( const row of rawScheduleData) {
    // Check if have index
    if (row[0]) { // There is an index
      currentIndex = row[0];
      // create new entry for coursecode
      formattedSchedule[currentIndex] = [];
      formattedSchedule[currentIndex].push({
        type: row[1],
        group: row[2],
        day: row[3],
        time: timeToIndexedTime(row[4]),
        venue: row[5],
        weeks: remarksToWeekNums(row[6]),
      });
    } else { // no index --> this row falls under the previously set currentIndex
      formattedSchedule[currentIndex].push({
        type: row[1],
        group: row[2],
        day: row[3],
        time: timeToIndexedTime(row[4]),
        venue: row[5],
        weeks: remarksToWeekNums(row[6]),
      });
    }
  }

  return formattedSchedule;
};

/**
* Converts time from scraped data to an number representing its position in a formattedSchedule
* 0: 0800-0830
* 1: 0830-0900 ...
* @param {String} rawTime - scraped data format eg. above
* @return {Array}
*/
function timeToIndexedTime(rawTime) {
  if (!rawTime) {
    return;
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
  };
  const timeArray = rawTime.split("-");
  const startIndex = timeDict[timeArray[0]];
  // change the 3rd digit of time to 3 if its 2 eg. 1720 to 1730
  if (timeArray[1][2] == "2") {
    timeArray[1] = timeArray[1].slice(0, 2).concat("30");
  } else if (timeArray[1][2] == "5") {
    const increasedHour = parseInt(timeArray[1].slice(1, 2)) + 1;
    timeArray[1] = timeArray[1].slice(0, 1).concat(`${increasedHour}00`);
  }

  const EndIndex = timeDict[timeArray[1]] - 1; // it ends at the previous time index hence minus 1

  const arrayLength = EndIndex - startIndex + 1;
  // python range() in javascript
  const timeIndex = [...Array(arrayLength).keys()].map((value) => value + startIndex);
  return timeIndex;
}

function remarksToWeekNums(rawRemark) {
  if (!rawRemark) return [...Array(13).keys()].map((value) => value + 1);
  if (!rawRemark.includes("Wk")) return []
  const temp = rawRemark.trim().split(" ");
  const weekString = temp[1];
  const weekNums = weekString.slice(2);

  if (weekNums.includes("-")) {
    let [beg, end] = weekNums.split("-");
    beg = parseInt(beg);
    end = parseInt(end);
    return [...Array(end-beg+1).keys()].map((value) => value + beg);
  } else if (weekNums.includes(",")) {
    const weekNumsArr = weekNums.split(",");
    const result = [];
    for (let i =0; i<weekNumsArr.length; i++) {
      result.push(parseInt(weekNumsArr[i]));
    }
    return result;
  } else if (parseInt(weekNums)) {
    return [parseInt(weekNums)];
  }
}
