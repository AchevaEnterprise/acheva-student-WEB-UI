import { Component, input, output } from '@angular/core';
import { MatDivider } from '@angular/material/divider';
import { SemesterEnum } from '../../../../core/models/school.model';
import { IStudentResult } from '../../../../core/models/student.model';
import { EmptyState } from '../../../../shared/empty-state/empty-state';
import { IStudentResultSemesterRecords } from '../../results';

@Component({
  selector: 'app-result-preview',
  imports: [MatDivider, EmptyState],
  templateUrl: './result-preview.html',
  styleUrl: './result-preview.scss',
})
export class ResultPreview {
  studentResults = input<IStudentResultSemesterRecords>();
  semsterEvent = output<IStudentResult & { semester: SemesterEnum }>();

  currentSemester = SemesterEnum.FIRST;
  SemesterEnum = SemesterEnum;

  viewResult(result: IStudentResult, semester: SemesterEnum) {
    this.currentSemester = semester;
    this.semsterEvent.emit({ ...result, semester });
  }
}
