import { Timestamp } from "firebase-admin/firestore";

export interface ScrapedExamInfo {
  examDate: Timestamp;
  examDay: string;
  examTime: string;
  courseCode: string;
  courseName: string;
  examDuration: string;
}