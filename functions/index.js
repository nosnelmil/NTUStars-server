const functions = require("firebase-functions");
const {log, error, warn} = require("firebase-functions/logger");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore} = require("firebase-admin/firestore");
const express = require("express");
const {scheduleScraper} = require("./ntuScheduleScraper");
const {formatData} = require("./scheduleFormatter");
const {clashFinder} = require("./clashFinder");
const {generateScheduleCombinations} = require("./scheduleCombinator");
const {checkRawData} = require("./checkRawData");
const {semScraper} = require("./ntuSemScraper");
const cors = require("cors")({origin: "https://ntu-schedule-maker.firebaseapp.com"});
// const cors = require("cors")({origin: true});
initializeApp();

const db = getFirestore();
const app = express();
app.use(cors);

// Database schema
// semestersInfo
//  //  data --> name: {2014;T: 2014 semester 1 , ...}, lastUpdated: DateTime
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
      log("entered");
      const docRef = db.collection("semestersInfo").doc("data");
      const doc = await docRef.get();
      let semesters = {};
      if (!doc.exists) {
        // No Such document --> scrape to get document
        semesters = await semScraper();
        log(semesters);
        if (semesters.keys().length == 0) {
          warn("SemScraper returned empty object");
        }
      } else {
        // TODO: check last updated
        if (new Date((new Date() - doc.data().lastUpdated)).getDay > 1) {
          // update database
          semesters = await semScraper();
          if (semesters.key().length == 0) {
            log("SemScraper returned empty object");
          }
        }
      }
    } catch (e) {
      error(e);
    } finally {
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
