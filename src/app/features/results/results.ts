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
          const { gpa, results } = firstSemesterResult.data;
          this.GPA.set(gpa);
          this.preview.set(results);

          this.results.update((results) => {
            results.firstSemsterResult = firstSemesterResult.data;
            results.secondSemesterResult = secondSemesterResult.data;

            return results;
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
