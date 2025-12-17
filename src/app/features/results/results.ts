import { Component, inject, OnInit, signal } from '@angular/core';
import { IResult } from '../../core/models/student.model';
import { StudentService } from '../../core/services/student';
import { ResultPreview } from './components/result-preview/result-preview';
import { ResultView } from './components/result-view/result-view';
import { ResultsList } from './components/results-list/results-list';

@Component({
  selector: 'app-results',
  imports: [ResultsList, ResultView, ResultPreview],
  templateUrl: './results.html',
  styleUrl: './results.scss',
})
export class Results implements OnInit {
  private readonly studentService = inject(StudentService);

  GPA = signal<number>(0);
  allResults = signal<IResult[]>([]);
  result = signal<IResult | null>(null);

  ngOnInit(): void {
    this.getResults();
  }

  getResults() {
    this.studentService.getResults().subscribe({
      next: (resp) => {
        const { gpa, results } = resp.data;
        this.GPA.set(gpa);
        this.allResults.set(results);
      },
    });
  }

  viewResult(result: IResult) {
    this.result.set(result);
  }
}
