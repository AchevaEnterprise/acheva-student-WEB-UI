import { standingLabel } from '../../../../core/utility/standing-label';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { finalize } from 'rxjs';
import { ImageFallbackDirective } from '../../../../core/directives/image-fallback.directive';
import { IStudentProfile } from '../../../../core/models/student.model';
import { MODE_OF_ENTRY_LABELS, SEX_OPTIONS } from '../../../../core/models/student-details.model';
import { StudentService } from '../../../../core/services/student';
import { AppState } from '../../../../core/store/app.state';
import { Button } from '../../../../shared/form/button/button';
import { Skeleton } from '../../../../shared/skeleton/skeleton';
import { Svg } from '../../../../shared/svg/svg';
import { selectProfile } from '../../../../core/store/profile/profile.selector';

@Component({
  selector: 'app-profile',
  imports: [
    Button,
    Svg,
    ImageFallbackDirective,
    DatePipe,
    Skeleton,
    TitleCasePipe,
    CommonModule,
    RouterLink,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit {
  private readonly studentService = inject(StudentService);
  private readonly store = inject(Store<AppState>);

  profile = signal<IStudentProfile | null>(null);
  loading = signal<boolean>(false);

  /** "300 Level", "Extra Year 1" or "Graduated" — never the raw EXCEPTION. */
  readonly standing = computed(() => standingLabel(this.profile()?.student));

  /** The transcript header's rows, as the student will see them printed. */
  readonly personalDetails = computed(() => {
    const student = this.profile()?.student;
    const sex = SEX_OPTIONS.find((option) => option.value === student?.sex)?.label;
    return [
      { label: 'Sex', value: sex ?? '—' },
      { label: 'Date of birth', value: dayFirst(student?.dateOfBirth) },
      { label: 'Nationality', value: student?.nationality || '—' },
      { label: 'State of origin', value: student?.stateOfOrigin || '—' },
      {
        label: 'Mode of entry',
        value: student?.modeOfEntry ? MODE_OF_ENTRY_LABELS[student.modeOfEntry] : '—',
      },
      { label: 'Option', value: student?.programmeOption || 'None' },
    ];
  });

  ngOnInit(): void {
    this.store.select(selectProfile).subscribe({
      next: (result) => {
        this.profile.set(result.profile);
      },
    });
  }

  getProfile() {
    this.loading.set(true);
    this.studentService
      .getProfile()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (resp) => {
          this.profile.set(resp.data);
        },
      });
  }
}

/**
 * DD/MM/YYYY, read from the stored date's own day: it is a calendar date
 * kept at UTC midnight, so formatting it in local time could show the day
 * before for anyone west of Greenwich.
 */
function dayFirst(value: string | null | undefined): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value ?? '');
  return match ? `${match[3]}/${match[2]}/${match[1]}` : '—';
}
