import { TitleCasePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  model,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { IAnalytics, LevelsEnum, SemesterEnum } from '../../core/models/school.model';
import { GreetingPipe } from '../../core/pipes/greeting.pipe';
import { Card } from '../../shared/card/card';
import { EmptyState } from '../../shared/empty-state/empty-state';
import { Skeleton } from '../../shared/skeleton/skeleton';
import { AuthenticationService } from '../auth/services/auth.service';
import { AnalyticsCard } from './components/analytics-card/analytics-card';
import { Chart } from './components/chart/chart';

import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { INotification } from '../../core/models/notification.model';
import { StudentService } from '../../core/services/student';
import { AppState } from '../../core/store/app.state';
import { notificationSelector } from '../../core/store/notification/notification.selector';
import { selectProfile } from '../../core/store/profile/profile.selector';
import { Button } from '../../shared/form/button/button';
import { ISegmentSwitcher } from '../../shared/segment-switcher/segment-switcher';
import { Activity } from './components/activity/activity';

@Component({
  selector: 'app-dashboard',
  // Mandatory on every component in this app, per the house rules — it was
  // the only feature page without it.
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AnalyticsCard,
    Card,
    Chart,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    EmptyState,
    MatDatepickerModule,
    // Activity,
    MatTableModule,
    MatMenuModule,
    TitleCasePipe,
    GreetingPipe,
    Button,
    Activity,
    Skeleton,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private readonly authService = inject(AuthenticationService);
  private readonly studentService = inject(StudentService);
  private readonly router = inject(Router);
  private readonly store = inject(Store<AppState>);
  private readonly destroyRef = inject(DestroyRef);

  analtyics = signal<IAnalytics[]>([
    {
      label: 'Results',
      count: 0,
      iconSrc: 'icons/general/result-analytics-icon.svg',
      infoLabel: 'Results published by the CA',
    },
    {
      label: 'Departmental Dues',
      count: 0,
      iconSrc: 'icons/general/departmental-due-icon.svg',
      infoLabel: 'Results published by the CA',
    },
  ]);

  displayedColumns: string[] = [
    'courseCode',
    'courseTitle',
    'session',
    'department',
    'faculty',
    'uploadedDate',
    'sentDate',
    'actions',
  ];
  dataSource = signal<unknown[]>([]);
  hasPaidDues = signal<boolean>(false);
  session = signal<string>('');
  cgpa = signal<number>(0);

  semesterOptions = signal<{ label: string; value: string }[]>([
    { label: '1st Semester', value: SemesterEnum.FIRST },
    { label: '2nd Semester', value: SemesterEnum.SECOND },
    // { label: '3rd Semester', value: SemesterEnum.THIRD },
  ]);

  segments = signal<ISegmentSwitcher[]>([
    {
      label: '100L',
      value: LevelsEnum.YEAR_ONE,
    },
    {
      label: '200L',
      value: LevelsEnum.YEAR_TWO,
    },
    {
      label: '300L',
      value: LevelsEnum.YEAR_THREE,
    },
    {
      label: '400L',
      value: LevelsEnum.YEAR_FOUR,
    },
    {
      label: '500L',
      value: LevelsEnum.YEAR_FIVE,
    },
    {
      label: '600L',
      value: LevelsEnum.YEAR_SIX,
    },
  ]);

  activeSegment = signal<ISegmentSwitcher>(this.segments()[0]);
  selectedCalendarDate = model<number>(Date.now());
  segmentCardLabel = signal<string>('Access your recent drafts from here');
  segmentCardIconSrc = signal<string>('icons/general/draft-icon.svg');

  activeAccount = this.authService.activeAccount;
  chart = signal<{ courseCode: string; total: number }[]>([]);
  SemesterEnum = SemesterEnum;
  activities = signal<INotification[]>([]);

  /**
   * Newest first by default. The dropdown beside "Recent Activity" offered
   * these two options and was bound to nothing — it changed on screen and
   * the list never moved. Mirrors the staff dashboard.
   */
  activitySort = signal<'newest' | 'oldest'>('newest');

  readonly sortedActivities = computed(() => {
    const rows = [...this.activities()];
    const newest = this.activitySort() === 'newest';
    return rows.sort((a, b) => {
      const left = new Date(a.createdAt).getTime();
      const right = new Date(b.createdAt).getTime();
      return newest ? right - left : left - right;
    });
  });

  setActivitySort(order: 'newest' | 'oldest'): void {
    this.activitySort.set(order);
  }

  /** Drive the dashboard skeletons while the analytics + performance load. */
  loadingAnalytics = signal(true);
  loadingChart = signal(true);

  switchSegment(switchValue: ISegmentSwitcher['value']) {
    this.activeSegment.update(
      () => this.segments().find((segment: ISegmentSwitcher) => segment.value === switchValue)!
    );

    this.getStudentResult(switchValue);
  }

  ngOnInit(): void {
    /**
     * `profile` is NULL until the store has loaded it, and the store emits
     * immediately on subscribe — so this threw
     * `Cannot destructure property 'cgpa' of 'result.profile' as it is null`
     * on every single dashboard load, before any data arrived.
     *
     * The `as { cgpa: number }` is what hid it: the assertion told the
     * compiler the value was always there, so the one check that would have
     * caught this was switched off by hand. Read it defensively instead.
     */
    this.store
      .select(selectProfile)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.cgpa.set(result?.profile?.cgpa ?? 0);
        },
      });

    const session = this.activeAccount()?.session;
    this.session.set(session!);
    this.getAnalytics();
    this.getPerformance();
    // this.getStudentResult(LevelsEnum.YEAR_ONE);
    this.getActivities();
  }

  getAnalytics() {
    this.loadingAnalytics.set(true);
    this.studentService
      .getAnalytics()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          const { results, departmentalDues, hasPaidDues } = resp.data;

          this.hasPaidDues.set(hasPaidDues);
          const updatedAnalytics = this.analtyics().map((analytics: IAnalytics) => {
            let count = analytics.count;

            if (analytics.label === 'Results') {
              count = results;
            } else if (analytics.label === 'Departmental Dues') {
              count = departmentalDues;
            }

            return {
              ...analytics,
              count,
            };
          });

          this.analtyics.set(updatedAnalytics);
        },
        complete: () => this.loadingAnalytics.set(false),
        error: () => this.loadingAnalytics.set(false),
      });
  }

  getPerformance(semester?: SemesterEnum) {
    const { session, level } = this.activeAccount()!;

    this.loadingChart.set(true);
    this.studentService
      .getResults(level!, session!, semester || SemesterEnum.FIRST)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          const result = resp.data.results?.map((perf) => ({
            courseCode: perf.courseCode,
            total: perf.total,
          }));
          this.chart.set(result);
        },
        complete: () => this.loadingChart.set(false),
        error: () => this.loadingChart.set(false),
      });
  }

  getStudentResult(_: LevelsEnum) {
    this.studentService
      .getMyResult()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          console.warn('Table: ', resp.data);
        },
      });
  }

  payResultFee() {
    this.router.navigate(['/payment-history']);
  }

  getActivities() {
    this.store
      .select(notificationSelector)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (notifications) => {
          this.activities.set(notifications);
        },
      });
  }
}
