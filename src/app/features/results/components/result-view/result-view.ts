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
/**
 * "Mathematics Department" → "Department of Mathematics". The template used
 * to prefix "DEPARTMENT OF" to a name that already ends in "Department",
 * printing "DEPARTMENT OF MATHEMATICS DEPARTMENT".
 */
function departmentHeading(name: string): string {
  const trimmed = name.trim();
  if (!trimmed || /^department\b/i.test(trimmed)) return trimmed;
  return `Department of ${trimmed.replace(/\s+department$/i, '')}`;
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

  /** Drives the footnote explaining why a listed score is not in the GPA. */
  readonly hasPendingRegistration = computed(() =>
    this.results().some((result) => result.awaitingRegistrationDecision)
  );

  resultData = computed<ResultViewData>(() => {
    this.results();
    const { fullName, department, faculty, school, registrationNumber } =
      this.authService.activeAccount()!;

    return {
      fullName: fullName ?? '',
      department: departmentHeading(department?.name ?? ''),
      faculty: faculty?.name ?? '',
      registrationNumber: registrationNumber ?? '',
      school: school?.name ?? '',
    };
  });
}
