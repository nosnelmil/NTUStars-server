import { Timestamp } from "firebase-admin/firestore";
import { ScrapedExamInfo } from "./models/ScrapedExamInfo";

import axios from "axios";
import qs from "qs";
import https from "https";
import cheerio from "cheerio"; // For HTML parsing
import { Element as CheerioElement } from "cheerio";

module.exports.examScraper =
  async function (examYear: string, semester: string, courseCode: string) {
    const result = await fetchExamTimetable({ examYear: examYear, semester });
    if (!result) {
      return null; // Return null if the fetch failed
    }
    // Return the specific course code info or null if not found
    return result.get(courseCode);
  };


/**
 * Fetches the exam timetable from NTU's website
 * @param {Object} params - The parameters for fetching the exam timetable
 * @param {string} params.examYear - The academic year of the exam
 * @param {string} params.semester - The semester of the exam
 * A map of course codes to exam information, or null if the fetch fails
 * @return {Promise<Map<string, ScrapedExamInfo> | null>}
 */
async function fetchExamTimetable(
  { examYear, semester }: { examYear: string, semester: string }) {
  const url = "https://wis.ntu.edu.sg/webexe/owa/exam_timetable_und.Get_detail";

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  const data = {
    academic_session: "",
    p_plan_no: "113",
    p_exam_yr: examYear,
    p_semester: semester,
    p_type: "UE",
    bOption: "Next",
    p_exam_dt: "",
    p_start_time: "",
    p_dept: "",
    p_subj: "",
    p_venue: "",
    p_matric: "",
  };

  try {
    const httpsAgent = new https.Agent({ rejectUnauthorized: false });
    const response = await axios.post(url, qs.stringify(data), { headers, httpsAgent });

    if (response.status !== 200) {
      throw new Error(`Failed to fetch exam timetable: ${response.statusText}`);
    }

    const $ = cheerio.load(response.data);
    const table = $("#ui_body_container .eyd-section:nth-child(2)").find("table").last();

    const examTimetableMap: Map<string, ScrapedExamInfo> = new Map(); // Course Code -> ScrapedExamInfo
    table.find("tr").each((i: number, row: CheerioElement) => {
      if (i < 2) {
        return;
      } // Skip the first two header rows
      const tds = $(row).find("td");
      const rowData: ScrapedExamInfo = {
        examDate: Timestamp.fromDate(new Date()), // Placeholder, will be set later
        examDay: "",
        examTime: "",
        courseCode: "",
        courseName: "",
        examDuration: "",
      };
      try {
        tds.each((j: number, cell: CheerioElement) => {
          switch (j) {
            case 0: // Exam Date
              rowData.examDate = Timestamp.fromDate(new Date($(cell).text().trim()));
              break;
            case 1: // Start Day
              rowData.examDay = $(cell).text().trim();
              break;
            case 2: // Exam Time
              rowData.examTime = $(cell).text().trim();
              break;
            case 3: // Course Code
              rowData.courseCode = String($(cell).text().trim()).toUpperCase();
              break;
            case 4: // Venue
              rowData.courseName = String($(cell).text().trim()).toUpperCase();
              break;
            case 5: // Remarks
              rowData.examDuration = $(cell).text().trim();
              break;
            default:
              break;
          }
        });
      } catch (error) {
        console.error(`Error processing row ${i}. Row had malformed data or missing trs:`, error);
      }
      if (!rowData.courseCode) {
        return; // Skip rows without course code
      }
      examTimetableMap.set(rowData.courseCode, rowData);
    });
    console.log("Count:", examTimetableMap.size);
    return examTimetableMap;
  } catch (error: any) {
    console.error("Error fetching exam timetable:", error);
    return null;
  }
}
