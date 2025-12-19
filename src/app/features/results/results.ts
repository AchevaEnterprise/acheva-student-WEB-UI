import { Component, inject, signal } from '@angular/core';
import { IResult } from '../../core/models/student.model';
import { StudentService } from '../../core/services/student';
import { ToastService } from '../../core/utility/toast.service';
import { ResultPreview } from './components/result-preview/result-preview';
import { ResultView } from './components/result-view/result-view';
import { IResultSessions, ResultsList } from './components/results-list/results-list';
import { UtilityService } from '../../core/utility/utility.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-results',
  imports: [ResultsList, ResultView, ResultPreview],
  templateUrl: './results.html',
  styleUrl: './results.scss',
})
export class Results {
  private readonly studentService = inject(StudentService);
  private readonly toastService = inject(ToastService);
  private readonly utils = inject(UtilityService);

  GPA = signal<number>(0);
  results = signal<IResult[]>([]);

  viewResult(sessionData: IResultSessions) {
    this.utils.showLoader();
    const { session, level } = sessionData;

    this.studentService
      .getResults(level, session)
      .pipe(finalize(() => this.utils.hideLoader()))
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
}
