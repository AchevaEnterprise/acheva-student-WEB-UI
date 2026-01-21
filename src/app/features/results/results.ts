import { Component, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { LevelsEnum, SemesterEnum } from '../../core/models/school.model';
import { IResult, IResultEntry } from '../../core/models/student.model';
import { StudentService } from '../../core/services/student';
import { ToastService } from '../../core/utility/toast.service';
import { ResultPreview } from './components/result-preview/result-preview';
import { ResultView } from './components/result-view/result-view';
import { IResultSessions, ResultsList } from './components/results-list/results-list';

@Component({
  selector: 'app-results',
  imports: [ResultsList, ResultView, ResultPreview],
  templateUrl: './results.html',
  styleUrl: './results.scss',
})
export class Results {
  private readonly studentService = inject(StudentService);
  private readonly toastService = inject(ToastService);

  GPA = signal<number>(0);
  results = signal<IResult[]>([]);
  resultEntries = signal<IResultEntry[]>([]);

  loading = signal(false);

  filter = signal({
    session: '',
    level: LevelsEnum.YEAR_ONE,
    semester: SemesterEnum.FIRST,
  });

  getResult() {
    this.loading.set(true);
    const { session, level, semester } = this.filter();

    this.studentService
      .getResults(level, session, semester)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (resp) => {
          if (!resp.status) {
            this.toastService.showNotification('error', 'Error Occured', resp.message);
            return;
          }

          const { gpa, results } = resp.data;
          this.GPA.set(gpa);
          this.results.set(results);
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

  getSemesterResult(semster: SemesterEnum) {
    this.filter.update((filter) => {
      filter.semester = semster;
      return filter;
    });

    this.getResult();
  }

  setResultEntries(entries: IResultEntry[]) {
    this.resultEntries.set(entries);
  }
}
