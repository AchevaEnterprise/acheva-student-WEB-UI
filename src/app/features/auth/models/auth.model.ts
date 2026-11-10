import { IDepartment, IFaculty, ISchool, LevelsEnum } from '../../../core/models/school.model';

export interface ILogIn {
  email: string;
  password: string;
}

export interface ISignUp {
  fullName: string;
  registrationNumber: string;
  faculty: string;
  department: string;
  school: string;
  email: string;
  password: string;
  confirmPassword: string;
  session: string;
  level: LevelsEnum;
}

export interface IAuthProfile {
  id: string;
  fullName: string;
  registrationNumber: string;
  email: string;
  faculty: IFaculty;
  department: IDepartment;
  school: ISchool;
  session: string;
  level: LevelsEnum;
  accountType: 'STUDENT';
  emailVerified: true;
  /**
   * True until the student has given the details the transcript prints —
   * the portal holds them on `/details` until then. Absent on a session
   * signed in before this existed, which the guard settles with the server.
   */
  detailsRequired?: boolean;
  /** IN_PROGRAMME · AWAITING_RESULTS · EXTRA_YEAR · GRADUATED — see `standing-label.ts`. */
  academicStanding?: 'IN_PROGRAMME' | 'AWAITING_RESULTS' | 'EXTRA_YEAR' | 'GRADUATED';
  extraYear?: number;
  graduatedSession?: string | null;
  accessToken: string;
  refreshToken: string;
}

export type IAccount = Omit<IAuthProfile, 'accessToken' | 'refreshToken'>;

export interface IStudentRegProfile {
  _id: string;
  fullName: string;
  registrationNumber: string;
  faculty: IFaculty;
  department: IDepartment;
  school: ISchool;
  level: LevelsEnum;
  admissionYear: string;
  accountType: 'STUDENT';
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IResetPassword {
  /** The six-digit code from the reset email. */
  token: string;
  password: string;
  confirmPassword: string;
}

export interface IAccessRefreshToken {
  accessToken: string;
  refreshToken: string;
}
