import { Component, computed, input, output } from '@angular/core';
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
  /**
   * The semester the sheet is showing, owned by the parent. It was a local
   * field, so after switching level the highlight (and the sheet's semester
   * label) could disagree with the results actually shown.
   */
  semester = input<SemesterEnum>(SemesterEnum.FIRST);
  semsterEvent = output<IStudentResult & { semester: SemesterEnum }>();

  SemesterEnum = SemesterEnum;

  /** A semester with no published results is not a page. */
  hasFirst = computed(() => !!this.studentResults()?.firstSemsterResult?.results?.length);
  hasSecond = computed(() => !!this.studentResults()?.secondSemesterResult?.results?.length);
  pageCount = computed(() => Number(this.hasFirst()) + Number(this.hasSecond()));

  viewResult(result: IStudentResult, semester: SemesterEnum) {
    this.semsterEvent.emit({ ...result, semester });
  }
}
