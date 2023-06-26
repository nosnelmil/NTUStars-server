const puppeteer = require("puppeteer");

const url = "https://wis.ntu.edu.sg/webexe/owa/aus_subj_cont.main";

module.exports.courseScraper = async function(sem, courseCode) {
  try {
    // start puppeteer
    const browser = await puppeteer.launch({
      // Note: --no-sandbox is required in this env.
      args: ["--no-sandbox"],
    });
    let page = await browser.newPage();
    let semester = sem.replace(';', '_')
    let schedule = [];
    let courseName = "";

    await page.goto(url);
    //  Select semester
    await page.waitForSelector(`select[name="acadsem"] > option[value= "${semester}"`);
    await page.select("select[name=\"acadsem\"]", semester);

    //  Input course code
    await page.waitForSelector("input[name=\"r_subj_code\"]");
    await page.$eval("input[name=\"r_subj_code\"]", (el, value) => el.value = value, courseCode);

    //  Click search button
    await page.waitForSelector("input[name=\"r_subj_code\"] + input[type = \"button\"]");
    await page.click("input[name=\"r_subj_code\"] + input[type = \"button\"]");

    await page.waitForSelector("body > center > table");

    const schedulePage = await newTarget.page();
    if (schedulePage) {
      courseName = await extractName(schedulePage);
      // scrape course schedule data
      schedule = await extractScheduleData(schedulePage);
      await schedulePage.close();
    } else {
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

async function extractContentData(ContentPage) {
  // await schedulePage.waitForSelector('table:nth-of-type(2) tbody tr:nth-of-type(2) td:nth-of-type(7)')
  const result = await contentPage.evaluate(async () => {
    const data = [];
    // eslint-disable-next-line no-undef
    const contentFrame = document.querySelector("#top > div > section:nth-child(2) > div > div > p:nth-child(1) > table > tbody > tr > td.smallText2 > table > tbody > tr > td:nth-child(1) > iframe ")
    const rows = contentFrame.contentWindow.document.querySelectorAll("table > tbody tr")
    data = []
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
    data
    return data;
  });
  return result;
}
// export default scheduleScraper
