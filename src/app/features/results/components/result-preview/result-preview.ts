import { Component, input, output } from '@angular/core';
import { MatDivider } from '@angular/material/divider';
import { SemesterEnum } from '../../../../core/models/school.model';
import { IResultEntry } from '../../../../core/models/student.model';
import { EmptyState } from '../../../../shared/empty-state/empty-state';

@Component({
  selector: 'app-result-preview',
  imports: [MatDivider, EmptyState],
  templateUrl: './result-preview.html',
  styleUrl: './result-preview.scss',
})
export class ResultPreview {
  resultEntries = input<IResultEntry[]>([]);
  semsterEvent = output<SemesterEnum>();

  currentSemester = SemesterEnum.FIRST;

  semstersOptions = [
    {
      value: SemesterEnum.FIRST,
      active: true,
    },
    {
      value: SemesterEnum.SECOND,
      active: true,
    },
    // {
    //   value: SemesterEnum.THIRD,
    //    active: true,
    // },
  ];

  viewSemesterResult(semster: SemesterEnum) {
    this.currentSemester = semster;
    this.semsterEvent.emit(semster);
  }
}
