const { error, log } = require("firebase-functions/logger");
const puppeteer = require("puppeteer");

const url = "https://wis.ntu.edu.sg/webexe/owa/aus_subj_cont.main";

module.exports.courseContentScraper = async function(sem, courseCode) {
  try {
    // start puppeteer
    const browser = await puppeteer.launch({
      // Note: --no-sandbox is required in this env.
      args: ["--no-sandbox"],
    });
    let page = await browser.newPage();
    let semester = sem.replace(';', '_')
    log("in scraper", semester)
    await page.goto(url);
    //  Select semester
    await page.waitForSelector(`select[name="acadsem"] > option[value= "${semester}"]`);
    await page.select("select[name=\"acadsem\"]", semester);

    //  Input course code
    await page.waitForSelector("input[name=\"r_subj_code\"]");
    await page.$eval("input[name=\"r_subj_code\"]", (el, value) => el.value = value, courseCode);

    //  Click search button
    await page.waitForSelector("input[name=\"r_subj_code\"] + input[type = \"button\"]");
    await page.click("input[name=\"r_subj_code\"] + input[type = \"button\"]");
    
    const iframeHandle = await page.$('iframe')
    const frame = await iframeHandle.contentFrame()
    await frame.waitForSelector("body > center")
    const contentRawData = await extractContentData(page)
    log("Completed getting raw data")
    browser.close();

    let contentData 
    if(contentRawData.length <= 1){
      contentData = null
    }else{
      contentData = parseRawContentData(contentRawData)
    }
    return contentData
  } catch (e) {
    error("error", e)
    return null
  }
};

async function extractContentData(contentPage) {
  // await schedulePage.waitForSelector('table:nth-of-type(2) tbody tr:nth-of-type(2) td:nth-of-type(7)')
  
  const result = await contentPage.evaluate(async () => {
    const data = [];
    // eslint-disable-next-line no-undef
    const contentFrame = document.querySelector("#top > div > section:nth-child(2) > div > div > p:nth-child(1) > table > tbody > tr > td.smallText2 > table > tbody > tr > td:nth-child(1) > iframe ")
    const rows = contentFrame.contentWindow.document.querySelectorAll("table > tbody tr")
    rows.forEach((row, index) => {
      let tdTags;
      const temp = [];
      tdTags = row.querySelectorAll("td");
      // get the value of each column in that row
      tdTags.forEach((td) => {
        if (td.innerText.trim() == "") { return }
        temp.push(td.innerText.trim());
      });
      if (temp.length == 0) { return }
      data.push(temp);
    });
    return data;
  });
  return result;
}

function parseRawContentData(rawContentData){
  const contentData = {
    courseCode: "",
    courseName: "",
    au: "",
    programme: "",
    gradeType: "Graded",
    preRequisite: "",
    mutexWith: [],
    notAvailTo: [],
    notAvailWith: "",
    remarks: "",
    description: "",
  }
  // preReq --> "Prerequisite:"
  // mutexWith --> "Mutually exclusive with:"
  // notAvailTo --> "Not available to Programme:"
  // notAvailWith --> "Not available to all Programme with:"
  // remarks --> "Not offered as Unrestricted Elective"
  // description --> last element in array
  contentData.courseCode = rawContentData[1][0]
  contentData.courseName = rawContentData[1][1]
  contentData.au = rawContentData[1][2]
  contentData.programme = rawContentData[1][3]
  contentData.description = rawContentData[rawContentData.length-1][0]

  const possibleHeaders = new Set(["Mutually exclusive with:", "Grade Type:", "Mutually exclusive with:","Not available to Programme:","Not available to all Programme with:", "Not offered as Unrestricted Elective"])
  for(var i=2; i<rawContentData.length-1; i++){
    cur = rawContentData[i]
    switch(cur[0]){
      case "Prerequisite:":
        contentData.preRequisite = cur[1]
        while(i<rawContentData.length-2){
          if(!(possibleHeaders.has(rawContentData[i+1][0]))){
            i++
            contentData.preRequisite = contentData.preRequisite.concat(` ${rawContentData[i][0]}`)
          }else{
            break
          }
        }
        break
      case "Grade Type:":
        contentData.gradeType = cur[1].trim()
        break
      case "Mutually exclusive with:":
        contentData.mutexWith = cur[1].split(",").map((item) => item.trim())
        break
      case "Not available to Programme:":
        contentData.notAvailTo = cur[1].split(",").map((item) => item.trim())
        break
      case "Not available to all Programme with:":
        contentData.notAvailWith = cur[1].trim()
        break
      default:
        contentData.remarks = cur[0].trim()
    }
  }
  return contentData
}
