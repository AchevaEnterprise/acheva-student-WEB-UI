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
  accessToken: string;
  refreshToken: string;
}

export type IAccount = Omit<IAuthProfile, 'accessToken' | 'refreshToken'>;

export interface IResetPassword {
  password: string;
  confirmPassword: string;
}

export interface IAccessRefreshToken {
  accessToken: string;
  refreshToken: string;
}
