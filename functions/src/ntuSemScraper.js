const puppeteer = require("puppeteer");

const url = "https://wish.wis.ntu.edu.sg/webexe/owa/aus_schedule.main";

module.exports.semScraper = async function (CourseCodes) {
  // start puppeteer
  const browser = await puppeteer.launch({
    // Note: --no-sandbox is required in this env.
    args: ["--no-sandbox"],
  });
  let result = {};
  try {
    const page = await browser.newPage();
    await page.goto(url);

    await page.waitForSelector("select[name=\"acadsem\"] > option[value= \"2014;T\"");

    result = await page.evaluate(async () => {
      const data = {};
      // eslint-disable-next-line no-undef
      const options = document.querySelectorAll("select[name=\"acadsem\"] > option");
      for (let i = 0; i < 3; i++) {
        const option = options[i];
        data[option.value] = option.innerText;
      }
      return data;
    });
  } catch (e) {
    return 0;
  } finally {
    browser.close();
  }
  return result;
};
