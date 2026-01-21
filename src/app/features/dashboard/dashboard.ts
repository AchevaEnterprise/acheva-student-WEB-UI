import { DatePipe, TitleCasePipe } from '@angular/common';
import { Component, inject, model, OnInit, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { IAnalytics, LevelsEnum, SemesterEnum } from '../../core/models/school.model';
import { GreetingPipe } from '../../core/pipes/greeting.pipe';
import { Card } from '../../shared/card/card';
import { EmptyState } from '../../shared/empty-state/empty-state';
import { Svg } from '../../shared/svg/svg';
import { AuthenticationService } from '../auth/services/auth.service';
import { IActivity } from './components/activity/activity';
import { AnalyticsCard } from './components/analytics-card/analytics-card';
import { Chart } from './components/chart/chart';

import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';
import { StudentService } from '../../core/services/student';
import { Button } from '../../shared/form/button/button';
import { Paginator } from '../../shared/paginator/paginator';
import { ISegmentSwitcher, SegmentSwitcher } from '../../shared/segment-switcher/segment-switcher';

@Component({
  selector: 'app-dashboard',
  imports: [
    AnalyticsCard,
    Card,
    Chart,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    SegmentSwitcher,
    EmptyState,
    MatDatepickerModule,
    // Activity,
    MatTableModule,
    MatMenuModule,
    Svg,
    TitleCasePipe,
    DatePipe,
    GreetingPipe,
    Paginator,
    Button,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private readonly authService = inject(AuthenticationService);
  private readonly studentService = inject(StudentService);
  private readonly router = inject(Router);

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

  semesterOptions = signal<{ label: string; value: string }[]>([
    { label: '1st Semester', value: SemesterEnum.FIRST },
    { label: '2nd Semester', value: SemesterEnum.SECOND },
    { label: '3rd Semester', value: SemesterEnum.THIRD },
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

  activities = signal<IActivity[]>([
    {
      type: 'submit',
      message: 'Database Management System (CSC 301) results has been submitted',
      date: new Date(),
    },
    {
      type: 'add',
      message: 'Created new course: Software Engineering (CSC 401)',
      date: new Date(),
    },
    {
      type: 'reminder',
      message: 'Reminder: Software Engineering (CSC 401) results due in 4 days',
      date: new Date(),
    },
    {
      type: 'add',
      message: 'Created new course: Software Engineering (CSC 401)',
      date: new Date(),
    },
    {
      type: 'edit',
      message: 'Updated scores for 4 Students in Software Engineering (CSC 401)',
      date: new Date(),
    },
  ]);

  activeAccount = this.authService.activeAccount;
  chart = signal<{ courseCode: string; total: number }[]>([]);
  SemesterEnum = SemesterEnum;

  switchSegment(switchValue: ISegmentSwitcher['value']) {
    this.activeSegment.update(
      () => this.segments().find((segment: ISegmentSwitcher) => segment.value === switchValue)!
    );

    this.getStudentResult(switchValue);
  }

  ngOnInit(): void {
    const session = this.activeAccount()?.session;
    this.session.set(session!);
    this.getAnalytics();
    this.getPerformance();
    this.getStudentResult(LevelsEnum.YEAR_ONE);
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

  getStudentResult(level: LevelsEnum) {
    this.studentService.getMyResult().subscribe({
      next: (resp) => {
        console.warn('Table: ', resp.data);
      },
    });
  }

  payResultFee() {
    this.router.navigate(['/payment-history']);
  }
}
