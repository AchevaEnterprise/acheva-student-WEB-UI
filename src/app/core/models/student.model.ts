import { ModeOfEntryEnum, StudentSexEnum } from './student-details.model';
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
  /**
   * Withdrawn/suspended students stay signed in and keep read access to
   * results published BEFORE `deactivatedAt`, but take no actions and receive
   * nothing published afterwards. Drives the view-only banner.
   */
  isActive: boolean;
  deactivatedAt: Date | null;
  /** The transcript header's personal rows — see `student-details.model.ts`. */
  sex?: StudentSexEnum | null;
  dateOfBirth?: string | null;
  nationality?: string | null;
  stateOfOrigin?: string | null;
  modeOfEntry?: ModeOfEntryEnum | null;
  programmeOption?: string | null;
  academicStanding?: 'IN_PROGRAMME' | 'AWAITING_RESULTS' | 'EXTRA_YEAR' | 'GRADUATED';
  extraYear?: number;
  graduatedSession?: string | null;
  /** The session whose results an AWAITING_RESULTS student is waiting on. */
  pendingSession?: string | null;
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
  /**
   * The score is published and real, but the student was not registered for
   * this course, so it does not count toward the GPA until their Course
   * Advisor confirms the registration. Shown, never hidden — a missing
   * result reads as a bug; a labelled one reads as a pending step.
   */
  awaitingRegistrationDecision?: boolean;
  /** The score was replaced through the moderation workflow (always a pass at E). */
  moderated?: boolean;
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
  /** See `IResult.awaitingRegistrationDecision`. */
  awaitingRegistrationDecision?: boolean;
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

export interface IStudentPerformance {
  courseCode: string;
  total: number;
}
