const { log } = require("firebase-functions/logger");
const puppeteer = require("puppeteer");

const url = "https://wish.wis.ntu.edu.sg/webexe/owa/aus_schedule.main";

module.exports.scheduleScraper = async function(semester, courseCode) {
  try {
    // start puppeteer
    const browser = await puppeteer.launch({
      // Note: --no-sandbox is required in this env.
      args: ["--no-sandbox"],
    });
    let page = await browser.newPage();
    let schedule = [];
    let courseName = "";
    let pageList = await browser.pages();
    for (let i = 1; i < pageList.length; i++) {
      await pageList[i].close();
    }
    pageList = [pageList[0]];
    page = pageList[0];
    await page.goto(url);
    //  Select semester
    await page.waitForSelector(`select[name="acadsem"] > option[value= "${semester}"`);
    await page.select("select[name=\"acadsem\"]", semester);

    //  Input course code
    await page.waitForSelector("input[name=\"r_subj_code\"]");
    await page.$eval("input[name=\"r_subj_code\"]", (el, value) => el.value = value, courseCode);

    //  Click search button
    await page.waitForSelector("input[name=\"r_subj_code\"]:nth-child(1) ~ input[type = \"button\"]");
    await page.click("input[name=\"r_subj_code\"]:nth-child(1) ~ input[type = \"button\"]");

    const newTarget = await browser.waitForTarget((target) => target.opener() === page.target());
    const schedulePage = await newTarget.page();
    if (schedulePage) {
      courseName = await extractName(schedulePage);
      // scrape course schedule data
      schedule = await extractScheduleData(schedulePage);
      await schedulePage.close();
    } else {
      log("Course Schedule Tab not detected");
    }

    browser.close();
    return [schedule, courseName];
  } catch (e) {
    return [[], null];
  }
};

async function extractName(schedulePage) {
  const result = await schedulePage.evaluate(async () => {
    // eslint-disable-next-line no-undef
    const title = document.querySelector("table:nth-of-type(1) tbody tr:nth-of-type(1) td:nth-of-type(2) b font ");
    return title.innerText.slice(0, -1);
  });
  return result;
}

async function extractScheduleData(schedulePage) {
  // await schedulePage.waitForSelector('table:nth-of-type(2) tbody tr:nth-of-type(2) td:nth-of-type(7)')
  const result = await schedulePage.evaluate(async () => {
    const data = [];
    // eslint-disable-next-line no-undef
    const rows = document.querySelectorAll("table:nth-of-type(2) tbody tr");
    let tdTags;
    rows.forEach((row, index) => {
      const temp = [];
      if (index == 0) {
        return;
      } else {
        tdTags = row.querySelectorAll("td");
      }
      // get the value of each column in that row
      tdTags.forEach((td) => {
        temp.push(td.innerText);
      });
      data.push(temp);
    });
    return data;
  });
  return result;
}
// export default scheduleScraper
