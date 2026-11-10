/**
 * The personal details the transcript header prints, asked for once on the
 * "Complete your details" page before the rest of the portal opens.
 *
 * Mirrors `acheva-nestjs/src/students/utils/student-details.ts` and
 * `students.enum.ts` — the two repos share no package, so change both.
 */

export enum StudentSexEnum {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export enum ModeOfEntryEnum {
  UME = 'UME',
  UTME = 'UTME',
  DIRECT_ENTRY = 'DIRECT_ENTRY',
  TRANSFER = 'TRANSFER',
  INTER_UNIVERSITY = 'INTER_UNIVERSITY',
  PRE_DEGREE = 'PRE_DEGREE',
}

export interface IStudentDetailsValues {
  readonly sex: StudentSexEnum | null;
  /** ISO date from the server; `YYYY-MM-DD` going back. */
  readonly dateOfBirth: string | null;
  readonly nationality: string | null;
  readonly stateOfOrigin: string | null;
  readonly modeOfEntry: ModeOfEntryEnum | null;
  readonly programmeOption: string | null;
  readonly programmeOptionId: string | null;
}

/** An option within the student's department's programme, as Acheva lists it. */
export interface IProgrammeOptionChoice {
  readonly id: string;
  readonly name: string;
}

/** `GET|PATCH /students/me/details` */
export interface IStudentDetails {
  readonly details: IStudentDetailsValues;
  readonly missing: readonly string[];
  /** True while the portal should keep the student on the details form. */
  readonly required: boolean;
  /** The department's options; empty where it has none and nothing is asked. */
  readonly options: readonly IProgrammeOptionChoice[];
  /**
   * Chosen once: school fees differ by option, so changing it afterwards is
   * Acheva's call, asked for through Support.
   */
  readonly optionLocked: boolean;
}

export interface IUpdateStudentDetails {
  readonly sex: StudentSexEnum;
  readonly dateOfBirth: string;
  readonly nationality: string;
  readonly stateOfOrigin: string;
  readonly modeOfEntry: ModeOfEntryEnum;
  /** One of `IStudentDetails.options`; null where the department has none. */
  readonly programmeOptionId: string | null;
}

export const SEX_OPTIONS: readonly { readonly value: StudentSexEnum; readonly label: string }[] = [
  { value: StudentSexEnum.MALE, label: 'Male' },
  { value: StudentSexEnum.FEMALE, label: 'Female' },
];

/**
 * UME is left out of the picker: JAMB renamed it UTME in 2010, so nobody
 * signing up now entered by it. A record imported with UME still shows it.
 */
export const MODE_OF_ENTRY_OPTIONS: readonly {
  readonly value: ModeOfEntryEnum;
  readonly label: string;
}[] = [
  { value: ModeOfEntryEnum.UTME, label: 'UTME' },
  { value: ModeOfEntryEnum.DIRECT_ENTRY, label: 'Direct Entry' },
  { value: ModeOfEntryEnum.PRE_DEGREE, label: 'Pre-degree' },
  { value: ModeOfEntryEnum.TRANSFER, label: 'Transfer' },
  { value: ModeOfEntryEnum.INTER_UNIVERSITY, label: 'Inter-university transfer' },
];

export const MODE_OF_ENTRY_LABELS: Readonly<Record<ModeOfEntryEnum, string>> = {
  [ModeOfEntryEnum.UME]: 'UME',
  [ModeOfEntryEnum.UTME]: 'UTME',
  [ModeOfEntryEnum.DIRECT_ENTRY]: 'Direct Entry',
  [ModeOfEntryEnum.PRE_DEGREE]: 'Pre-degree',
  [ModeOfEntryEnum.TRANSFER]: 'Transfer',
  [ModeOfEntryEnum.INTER_UNIVERSITY]: 'Inter-university transfer',
};

export const NIGERIAN = 'Nigerian';

/** The 36 states and the FCT, as the Registry writes them. */
export const NIGERIAN_STATES: readonly string[] = [
  'Abia',
  'Adamawa',
  'Akwa Ibom',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'FCT',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara',
];
