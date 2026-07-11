import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { SemesterEnum } from '../../../../core/models/school.model';
import { IResult } from '../../../../core/models/student.model';
import { UppercasePipe } from '../../../../core/pipes/uppercase.pipe';
import { EmptyState } from '../../../../shared/empty-state/empty-state';
import { Skeleton } from '../../../../shared/skeleton/skeleton';
import { StatusBadge } from '../../../../shared/status-badge/status-badge';
import { AuthenticationService } from '../../../auth/services/auth.service';

interface ResultViewData {
  fullName: string;
  school: string;
  department: string;
  faculty: string;
  registrationNumber: string;
}
@Component({
  selector: 'app-result-view',
  imports: [StatusBadge, EmptyState, UppercasePipe, CommonModule, Skeleton],
  templateUrl: './result-view.html',
  styleUrl: './result-view.scss',
})
export class ResultView {
  private readonly authService = inject(AuthenticationService);
  results = input<IResult[]>([]);
  gpa = input<number>();
  semester = input<SemesterEnum>();
  loading = input<boolean>();

  resultData = computed<ResultViewData>(() => {
    this.results();
    const { fullName, department, faculty, school, registrationNumber } =
      this.authService.activeAccount()!;

    return {
      fullName: fullName ?? '',
      department: department?.name ?? '',
      faculty: faculty?.name ?? '',
      registrationNumber: registrationNumber ?? '',
      school: school?.name ?? '',
    };
  });
}
