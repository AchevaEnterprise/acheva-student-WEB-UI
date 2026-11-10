/**
 * How a student's place in their programme reads: "300 Level", "Extra Year 2",
 * "Awaiting final results" or "Graduated". Mirrors `standingLabel` in the backend's
 * `academic-standing/utils/standing-rules.ts` — change both.
 *
 * An extra-year student's `level` is `EXCEPTION`, which means nothing to a
 * student; their standing is what they are shown instead.
 */
export interface IStandingCarrier {
  readonly level?: string | null;
  readonly academicStanding?: string | null;
  readonly extraYear?: number | null;
}

export function standingLabel(student: IStandingCarrier | null | undefined): string {
  if (!student) return '';
  if (student.academicStanding === 'GRADUATED') return 'Graduated';
  // Final (or extra) year is over but a registered course has no result yet.
  if (student.academicStanding === 'AWAITING_RESULTS') return 'Awaiting final results';
  if (student.academicStanding === 'EXTRA_YEAR' || student.level === 'EXCEPTION') {
    return `Extra Year ${Math.max(student.extraYear ?? 0, 1)}`;
  }
  return student.level ? `${student.level} Level` : '';
}

/** A level as a results heading reads it: "300 Level", or "Extra Year". */
export function levelLabel(level: string | null | undefined): string {
  if (!level) return '';
  return level === 'EXCEPTION' ? 'Extra Year' : `${level} Level`;
}
