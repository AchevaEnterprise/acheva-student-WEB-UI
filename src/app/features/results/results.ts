import { Component, inject, signal } from '@angular/core';
import { finalize, forkJoin } from 'rxjs';
import { LevelsEnum, SemesterEnum } from '../../core/models/school.model';
import { IResult, IStudentResult } from '../../core/models/student.model';
import { StudentService } from '../../core/services/student';
import { ResultPreview } from './components/result-preview/result-preview';
import { ResultView } from './components/result-view/result-view';
import { IResultSessions, ResultsList } from './components/results-list/results-list';

export interface IStudentResultSemesterRecords {
  firstSemsterResult: IStudentResult | null;
  secondSemesterResult: IStudentResult | null;
}

@Component({
  selector: 'app-results',
  imports: [ResultsList, ResultView, ResultPreview],
  templateUrl: './results.html',
  styleUrl: './results.scss',
})
export class Results {
  private readonly studentService = inject(StudentService);

  GPA = signal<number>(0);
  preview = signal<IResult[]>([]);
  semester = signal<SemesterEnum>(SemesterEnum.FIRST);

  results = signal<IStudentResultSemesterRecords>({
    firstSemsterResult: null,
    secondSemesterResult: null,
  });

  loading = signal(false);

  filter = signal({
    session: '',
    level: LevelsEnum.YEAR_ONE,
  });

  getResult() {
    this.loading.set(true);
    const { session, level } = this.filter();

    const semesterResults = [
      this.studentService.getResults(level, session, SemesterEnum.FIRST),
      this.studentService.getResults(level, session, SemesterEnum.SECOND),
    ];

    forkJoin(semesterResults)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ([firstSemesterResult, secondSemesterResult]) => {
          // Open on the semester that has results: a level published only
          // for the 2nd semester used to open on an empty 1st-semester sheet
          // ("No records exist…"), and the semester label kept whatever the
          // previous level had shown.
          const openSecond =
            !firstSemesterResult.data.results?.length &&
            !!secondSemesterResult.data.results?.length;
          const shown = openSecond ? secondSemesterResult.data : firstSemesterResult.data;
          this.GPA.set(shown.gpa);
          this.preview.set(shown.results);
          this.semester.set(openSecond ? SemesterEnum.SECOND : SemesterEnum.FIRST);

          // A new object, so the preview panel (an input) sees the change.
          this.results.set({
            firstSemsterResult: firstSemesterResult.data,
            secondSemesterResult: secondSemesterResult.data,
          });
        },
      });
  }

  viewResult(sessionData: IResultSessions) {
    const { session, level } = sessionData;
    this.filter.update((filter) => {
      filter.session = session;
      filter.level = level;

      return filter;
    });

    this.getResult();
  }

  getSemesterResult(studentResult: IStudentResult & { semester: SemesterEnum }) {
    const { gpa, results, semester } = studentResult;
    this.GPA.set(gpa);
    this.semester.set(semester);
    this.preview.set(results);
  }
}
