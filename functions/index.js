const functions = require("firebase-functions");
const {log, error} = require("firebase-functions/logger");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore, FieldValue} = require("firebase-admin/firestore");
const express = require("express");
const {scheduleScraper} = require("./ntuScheduleScraper");
const {formatData} = require("./scheduleFormatter");
const {clashFinder} = require("./clashFinder");
const {generateScheduleCombinations} = require("./scheduleCombinator");
const {checkRawData} = require("./checkRawData");
const {semScraper} = require("./ntuSemScraper");
const {calcDateDiff} = require("./helper/calcDateDiff");
const cors = require("cors")({origin: "https://ntu-schedule-maker.firebaseapp.com"});
// const cors = require("cors")({origin: true});
initializeApp();

const db = getFirestore();
const app = express();
app.use(cors);

// Database schema
// semestersInfo
//  //  data --> names: {2014;T: 2014 semester 1 , ...}, updatedAt: DateTime
// 2014;T
//  // coursecode
//  //... (all course code)
// 2015...
//  // coursecode
//  //... (all course code)
// ...

app.get("/get-semesters", async (req, res) => {
  cors(req, res, async () => {
    try {
      const docRef = db.collection("semestersInfo").doc("data");
      const doc = await docRef.get();
      let toUpdate = false;
      let semesters = {};
      if (!doc.exists || calcDateDiff(doc.data().updatedAt.toDate(), new Date()) >= 1 ) {
        // No Such document / needs to be updated --> scrape to get document
        semesters = await semScraper();
        if (Object.keys(semesters).length == 0) {
          error("SemScraper returned empty object");
          throw new Error("Error Scraping Semesters");
        }
        toUpdate=true;
        // return semesters then store it
      } else {
        semesters = doc.data().names;
      }
      res.json({
        semesters,
        success: true,
        errorInfo: "",
      });
      res.status(200).end();
      if (toUpdate) {
        log("Updating semestersInfo");
        await docRef.set({
          names: semesters,
          updatedAt: FieldValue.serverTimestamp(),
        });
        log("Updated SemestersInfo");
      }
      // Store semestersInfo
    } catch (e) {
      error(e);
      res.json({
        success: false,
        errorInfo: e,
      });
      res.status(500).end();
    }
  });
});

app.post("/generate-timetables", async (req, res) => {
  cors(req, res, async ()=>{
    try {
      const courseCodes = req.body;
      // Get from database --> if not in database then scrape it
      const rawScheduleData = await scheduleScraper(courseCodes);
      const error = checkRawData(rawScheduleData); // Check if any invalid course code was passed in
      // functions.logger.log("rawScheduleData", rawScheduleData);
      if (error) {
        res.json({
          success: false,
          errorCode: 0,
          errorInfo: error,
          timetables: [],
        });
        res.status(200).end();
      } else {
        const formattedData = formatData(rawScheduleData);

        const scheduleCombinations = generateScheduleCombinations(formattedData);
        log.log("scheduleCombinations", scheduleCombinations.length);

        const allPossibleTimetables = scheduleCombinations.filter((combination) => !clashFinder(combination.data));
        log.log("allPossibleTimetables", allPossibleTimetables.length);

        res.json({
          success: true,
          timetables: allPossibleTimetables,
          totalCombinations: scheduleCombinations.length,
          successfulCombinations: allPossibleTimetables.length,
        });
        res.status(200).end();
      }
    } catch (e) {
      console.log("ERROR", e);
      res.status(500).end();
    }
  });
});

exports.app = functions.region("asia-east2").https.onRequest(app);
