import { TitleCasePipe } from '@angular/common';
import { Component, inject, model, OnInit, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { IAnalytics, LevelsEnum, SemesterEnum } from '../../core/models/school.model';
import { GreetingPipe } from '../../core/pipes/greeting.pipe';
import { Card } from '../../shared/card/card';
import { EmptyState } from '../../shared/empty-state/empty-state';
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
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private readonly authService = inject(AuthenticationService);
  private readonly studentService = inject(StudentService);
  private readonly router = inject(Router);
  private readonly store = inject(Store<AppState>);

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

  switchSegment(switchValue: ISegmentSwitcher['value']) {
    this.activeSegment.update(
      () => this.segments().find((segment: ISegmentSwitcher) => segment.value === switchValue)!
    );

    this.getStudentResult(switchValue);
  }

  ngOnInit(): void {
    this.store.select(selectProfile).subscribe({
      next: (result) => {
        const { cgpa } = result.profile as { cgpa: number };
        this.cgpa.set(cgpa);
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
    this.studentService.getAnalytics().subscribe({
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
    });
  }

  getPerformance(semester?: SemesterEnum) {
    const { session, level } = this.activeAccount()!;

    this.studentService.getResults(level!, session!, semester || SemesterEnum.FIRST).subscribe({
      next: (resp) => {
        const result = resp.data.results?.map((perf) => ({
          courseCode: perf.courseCode,
          total: perf.total,
        }));
        this.chart.set(result);
      },
    });
  }

  getStudentResult(_: LevelsEnum) {
    this.studentService.getMyResult().subscribe({
      next: (resp) => {
        console.warn('Table: ', resp.data);
      },
    });
  }

  payResultFee() {
    this.router.navigate(['/payment-history']);
  }

  getActivities() {
    this.store.select(notificationSelector).subscribe({
      next: (notifications) => {
        this.activities.set(notifications);
      },
    });
  }
}
