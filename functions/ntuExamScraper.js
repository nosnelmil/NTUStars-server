const axios = require('axios');
const qs = require('qs');
const https = require('https');
const cheerio = require('cheerio'); // For HTML parsing

module.exports.examScraper = async function (examYear, semester, courseCode) {
  const result = await fetchExamTimetable({ examYear: examYear, semester });
  return result;
};

async function fetchExamTimetable({ examYear, semester }) {
  const url = 'https://wis.ntu.edu.sg/webexe/owa/exam_timetable_und.Get_detail';

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const data = {
    academic_session: '',
    p_plan_no: '113',
    p_exam_yr: examYear,
    p_semester: semester,
    p_type: 'UE',
    bOption: 'Next',
    p_exam_dt: '',
    p_start_time: '',
    p_dept: '',
    p_subj: '',
    p_venue: '',
    p_matric: '',
  };

  try {
    const httpsAgent = new https.Agent({ rejectUnauthorized: false });
    const response = await axios.post(url, qs.stringify(data), { headers, httpsAgent });

    if (response.status !== 200) {
      throw new Error(`Failed to fetch exam timetable: ${response.statusText}`);
    }

    const $ = cheerio.load(response.data);
    const table = $('#ui_body_container .eyd-section:nth-child(2)').find('table').last();

    const examTimetable = [];

    table.find('tr').each((i, row) => {
      if (i < 2) { return; } // Skip the first two header rows
      const tds = $(row).find('td');
      const rowData = [];
      tds.each((j, cell) => {
        rowData.push($(cell).text().trim());
      });

      if (rowData.length > 0) {
        examTimetable.push(rowData);
      }
    });
    console.log('First Exam Timetable:', examTimetable[0]);
    console.log('Last Exam Timetable:', examTimetable.at(examTimetable.length - 1));
    console.log('Count:', examTimetable.length);
    return examTimetable;

  } catch (error) {
    console.error('Error fetching exam timetable:', error.message);
    return [];
  }
}
