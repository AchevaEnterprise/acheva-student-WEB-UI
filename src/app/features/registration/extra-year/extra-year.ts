import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import { ToastService } from '../../../core/utility/toast.service';
import { Skeleton } from '../../../shared/skeleton/skeleton';
import { IBorrowableCourse, IExtraYearOptions, RegistrationService } from '../registration.service';

/** A semester's worth of the proposal, as the page has to present it. */
interface ISemesterPlan {
  semester: string;
  retakes: { courseCode: string; units: number }[];
  borrowed: IBorrowableCourse[];
  units: number;
  min: number;
  max: number;
  short: number;
  over: number;
}

/**
 * Registering an extra year.
 *
 * ## The two halves are not the same kind of choice
 *
 * The courses a student failed are **not optional** — they are the reason
 * the year exists — so they are shown as settled, not as checkboxes. What
 * is actually being chosen is the borrowing: final-year courses from
 * anywhere in their faculty, used to bring each semester up to a legal
 * load. Presenting both as a single pick-list would invite someone to
 * deselect the course standing between them and a degree.
 *
 * ## The load is per SEMESTER
 *
 * 15 to 24 in each, the ordinary registration rule. The counter is
 * therefore per semester too: one combined figure would tell a student
 * owing three units in second semester that they need twelve more, when
 * they need twelve there and a full fifteen in first.
 *
 * ## It is a proposal
 *
 * The button says so. A borrowed course is another department's class with
 * a finite number of places in it, and the Course Advisor decides.
 */
@Component({
  selector: 'app-extra-year',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Skeleton],
  templateUrl: './extra-year.html',
  styleUrl: './extra-year.scss',
})
export class ExtraYear implements OnInit {
  private readonly api = inject(RegistrationService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly options = signal<IExtraYearOptions | null>(null);
  readonly notEligible = signal(false);

  /** Course ids the student has ticked. Retakes are never in here. */
  readonly picked = signal<Record<string, boolean>>({});

  readonly session = signal('');

  readonly mustRetake = computed(() => this.options()?.mustRetake ?? []);
  readonly canBorrow = computed(() => this.options()?.canBorrow ?? []);

  /** Borrowable courses grouped under the semester they run in. */
  readonly borrowBySemester = computed(() => {
    const groups = new Map<string, IBorrowableCourse[]>();
    for (const course of this.canBorrow()) {
      const list = groups.get(course.semester) ?? [];
      list.push(course);
      groups.set(course.semester, list);
    }
    return [...groups].map(([semester, courses]) => ({ semester, courses }));
  });

  /**
   * Where each semester stands against the 15–24 it has to land inside.
   *
   * Recomputed on every tick so the student can see a semester go legal
   * rather than discovering on submit that one of them was short.
   */
  readonly plan = computed<ISemesterPlan[]>(() => {
    const options = this.options();
    if (!options) return [];

    const picked = this.picked();
    const plans = new Map<string, ISemesterPlan>();

    const blank = (semester: string): ISemesterPlan => ({
      semester,
      retakes: [],
      borrowed: [],
      units: 0,
      min: options.load.min,
      max: options.load.max,
      short: 0,
      over: 0,
    });

    for (const need of options.load.perSemester) {
      plans.set(need.semester, blank(need.semester));
    }

    for (const retake of options.mustRetake) {
      const plan = plans.get(retake.courseSemester) ?? blank(retake.courseSemester);
      plan.retakes.push({ courseCode: retake.courseCode, units: retake.units });
      plan.units += retake.units;
      plans.set(retake.courseSemester, plan);
    }

    for (const course of this.canBorrow()) {
      if (!picked[course.courseId]) continue;
      const plan = plans.get(course.semester) ?? blank(course.semester);
      plan.borrowed.push(course);
      plan.units += course.units;
      plans.set(course.semester, plan);
    }

    for (const plan of plans.values()) {
      plan.short = Math.max(0, plan.min - plan.units);
      plan.over = Math.max(0, plan.units - plan.max);
    }

    return [...plans.values()].sort((a, b) => a.semester.localeCompare(b.semester));
  });

  /** Every semester legal, and nothing still to fix. */
  readonly canSubmit = computed(
    () =>
      !this.submitting() &&
      this.plan().length > 0 &&
      this.plan().every((p) => p.short === 0 && p.over === 0)
  );

  ngOnInit(): void {
    this.api
      .extraYearOptions()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          this.options.set(resp.data);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          /**
           * A student who is not in extra year is not an error case — the
           * server says so with a 400 and the page should explain it
           * rather than show a red toast over an empty screen.
           */
          if (err?.status === 400) {
            this.notEligible.set(true);
            return;
          }
          this.toast.showNotification(
            'error',
            'Could not load your options',
            err?.error?.message ?? 'Please try again.'
          );
        },
      });
  }

  toggle(course: IBorrowableCourse): void {
    this.picked.update((current) => ({
      ...current,
      [course.courseId]: !current[course.courseId],
    }));
  }

  isPicked(course: IBorrowableCourse): boolean {
    return !!this.picked()[course.courseId];
  }

  submit(): void {
    const options = this.options();
    const session = this.session().trim();
    if (!options || !this.canSubmit()) return;

    if (!session) {
      this.toast.showNotification(
        'warning',
        'Which session?',
        'Enter the session this extra year is for, e.g. 2025/2026.'
      );
      return;
    }

    /**
     * Retakes are sent WITH the borrowed courses, in one list. The server
     * decides which is which from the student's own carry-over ledger — a
     * client that could label a borrowed course as a retake could skip the
     * course it actually failed.
     */
    const courseIds = [
      ...options.mustRetake.map((c) => c.courseId),
      ...Object.entries(this.picked())
        .filter(([, on]) => on)
        .map(([id]) => id),
    ];

    this.submitting.set(true);
    this.api
      .proposeExtraYear(session, courseIds)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.toast.showNotification(
            'success',
            'Sent to your Course Advisor',
            'You will be registered once they approve it.'
          );
          void this.router.navigate(['/registration']);
        },
        error: (err) => {
          this.submitting.set(false);
          this.toast.showNotification(
            'error',
            'Could not submit',
            err?.error?.message ?? 'Please check your selection and try again.'
          );
        },
      });
  }
}
