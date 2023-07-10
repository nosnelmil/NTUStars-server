const {onRequest} = require("firebase-functions/v2/https");
const {setGlobalOptions, logger} = require("firebase-functions/v2");
const {log, error, warn} = require("firebase-functions/logger");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore, FieldValue} = require("firebase-admin/firestore");
const {scheduleScraper} = require("./ntuScheduleScraper");
const {courseContentScraper} = require("./ntuCourseScraper");
const {semScraper} = require("./ntuSemScraper");
const {calcDateDiff} = require("./helper/calcDateDiff");
const { validateRequest } = require("./helper/validateRequest");
// const cors = require("cors")({origin:[ "https://ntustars.com", "http://127.0.0.1:5173/"]});
initializeApp();

const db = getFirestore();
// setGlobalOptions({ cors: [/ntustars\.com$/], region: "asia-east1" });
setGlobalOptions({ cors: true, region: "asia-east1" });
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

exports.getSemesters = onRequest(async (req, res) => {
  try {
    logger("entered")
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
    return null
  }
});

exports.getSchedule = onRequest({memory: "512MB"}, async (req, res) => {
  try {
    const data = req.body;
    log(data)
    // validate data
    if (validateRequest(data)){
      throw new HttpsError("invalid-argument", "The function must be called " +
          "with two arguments \"Semester & Course\".");
    }
    const semester = data.semester.trim().toUpperCase();
    const courseCode = data.courseCode.trim().toUpperCase();
    // Get from database --> if not in database then scrape it
    const docRef = db.collection(semester).doc(courseCode);
    const doc = await docRef.get();
    if (!doc.exists || doc.data().schedule == null || doc.data().au == null) {
      const result = await scheduleScraper(semester, courseCode);
      if (!result) {
        res.status(200).end();
        return
      }
      res.json(result);
      res.status(200).end();
      
      // Update database
      log(`Uploading Sem ${semester} - Course ${courseCode} to db`);
      await docRef.set({
        ...result,
        updatedAt: FieldValue.serverTimestamp(),
      }, {merge: true});
      log("Uploaded");
    } else {
      res.json(doc.data());
      res.status(200).end();
      return
    }
  } catch (e) {
    error("/get-schedule error", e);
    res.status(500).end();
  }
});
exports.getCourseContent = onRequest(async (req, res) => {
  try {
    const data = req.body;
    log(data)
    // validate data
    if (validateRequest(data)){
      throw new HttpsError("invalid-argument", "The function must be called " +
          "with two arguments \"Semester & Course\".");
    }
    const semester = data.semester.trim().toUpperCase();
    const courseCode = data.courseCode.trim().toUpperCase();

    let contentData
    // Get from database --> if not in database then scrape it
    const docRef = db.collection(semester).doc(courseCode);
    const doc = await docRef.get();
    if (!doc.exists || doc.data().description == null) {
      contentData = await courseContentScraper(semester, courseCode);
      if (!contentData) {
        res.status(200).end();
        return
      }
      res.json(contentData)
      res.status(200).end();
      
      // Update database
      log(`Uploading Sem ${semester} - Course ${courseCode} Content to db`);
      await docRef.set({
        ...contentData,
        updatedAt: FieldValue.serverTimestamp(),
      }, {merge: true});
      log("Uploaded");
    } else {
      res.json(doc.data());
      res.status(200).end();
      return
    }
  } catch (e) {
    error("/get-schedule error", e);
    res.status(500).end();
  }
});


exports.getTimeDict = onRequest( async (req, res) => {
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
  res.json({
    timeDict,
  });
});