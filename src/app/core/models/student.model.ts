import { IDepartment, IFaculty, ISchool, LevelsEnum } from './school.model';

export interface IStudent {
  _id: string;
  fullName: string;
  registrationNumber: string;
  faculty: IFaculty;
  department: IDepartment;
  school: ISchool;
  email: string;
  session: string;
  level: string;
  accountType: 'STUDENT';
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStudentProfile {
  courseAdviserName: string;
  departmentalDues: number;
  cgpa: number;
  coursesEnrolled: number;
  student: IStudent;
}

export interface IStudentAnalytics {
  results: number;
  departmentalDues: number;
  hasPaidDues: boolean;
}

export interface IResult {
  _id: string;
  test: number;
  lab: number;
  exam: number;
  total: number;
  grade: string;
  status: string;
  courseLoad: number;
  courseCode: string;
}

export interface IResultEntry {
  resultId: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  test: number;
  lab: number;
  exam: number;
  total: number;
  grade: string;
  status: string;
  createdAt: Date;
}

export interface IStudentResult {
  gpa: number;
  results: IResult[];
}

export interface IStudentSessionsResult {
  session: string;
  level: LevelsEnum;
  entries: IResultEntry[];
}
