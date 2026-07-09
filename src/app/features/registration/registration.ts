import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { TitleCasePipe, DatePipe } from '@angular/common';
import { finalize } from 'rxjs';
import { IMyRegistration, IRegistrationEntry, RegistrationService } from './registration.service';

interface IElectiveGroupView {
  group: string;
  registered: IRegistrationEntry | null;
  options: readonly {
    courseId: string;
    label: string;
    isCurrent: boolean;
  }[];
  /** courseId chosen in the dropdown, staged until Swap is pressed. */
  selection: string;
}

/**
 * Course Registration (student view): what the university registered for
 * you, with elective self-service inside the grace window. Swaps are one
 * request (drop + add) so group minimums always hold.
 */
@Component({
  selector: 'app-registration',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TitleCasePipe, DatePipe],
  templateUrl: './registration.html',
  styleUrl: './registration.scss',
})
export class Registration implements OnInit {
  private readonly registrationService = inject(RegistrationService);

  loading = signal(true);
  acting = signal(false);
  data = signal<IMyRegistration | null>(null);
  message = signal<{ kind: 'ok' | 'error'; text: string } | null>(null);

  readonly registration = computed(() => this.data()?.registration ?? null);
  readonly grace = computed(() => this.data()?.grace ?? null);

  readonly activeEntries = computed(() =>
    (this.registration()?.entries ?? []).filter((entry) => entry.status === 'REGISTERED')
  );

  readonly siwesUnits = computed(() => {
    const registration = this.registration();
    return registration ? registration.totalUnits - registration.nonSiwesUnits : 0;
  });

  /** Grouped electives with their swap options. */
  readonly electiveGroups = computed<IElectiveGroupView[]>(() => {
    const data = this.data();
    if (!data?.registration) return [];
    const groups = new Map<string, IElectiveGroupView>();

    for (const option of data.electiveOptions) {
      if (!option.electiveGroup) continue;
      const view = groups.get(option.electiveGroup) ?? {
        group: option.electiveGroup,
        registered: null,
        options: [],
        selection: '',
      };
      const registered = this.activeEntries().find(
        (entry) => String(entry.course) === option.course._id
      );
      if (registered) view.registered = registered;
      view.options = [
        ...view.options,
        {
          courseId: option.course._id,
          label: `${option.course.courseCode} — ${option.course.courseTitle} (${option.units}u)`,
          isCurrent: !!registered,
        },
      ];
      groups.set(option.electiveGroup, view);
    }
    return [...groups.values()];
  });

  /** Ungrouped electives the student may add freely (within bounds). */
  readonly optionalElectives = computed(() => {
    const data = this.data();
    if (!data?.registration) return [];
    const registeredIds = new Set(this.activeEntries().map((entry) => String(entry.course)));
    return data.electiveOptions
      .filter((option) => !option.electiveGroup)
      .map((option) => ({
        courseId: option.course._id,
        code: option.course.courseCode,
        title: option.course.courseTitle,
        units: option.units,
        registered: registeredIds.has(option.course._id),
      }));
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.registrationService
      .me()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (resp) => this.data.set(resp.data),
        error: () =>
          this.message.set({
            kind: 'error',
            text: 'Could not load your registration.',
          }),
      });
  }

  swap(group: IElectiveGroupView, event: Event): void {
    const target = (event.target as HTMLSelectElement).value;
    if (!target || !group.registered || target === String(group.registered.course)) {
      return;
    }
    this.mutate(
      {
        drop: [{ courseId: String(group.registered.course) }],
        add: [{ courseId: target }],
      },
      'Elective swapped.'
    );
  }

  addOptional(courseId: string): void {
    this.mutate({ add: [{ courseId }] }, 'Elective added.');
  }

  dropOptional(courseId: string): void {
    this.mutate({ drop: [{ courseId }] }, 'Elective dropped.');
  }

  private mutate(
    body: { add?: { courseId: string }[]; drop?: { courseId: string }[] },
    okText: string
  ): void {
    this.acting.set(true);
    this.message.set(null);
    this.registrationService
      .editElectives(body)
      .pipe(finalize(() => this.acting.set(false)))
      .subscribe({
        next: (resp) => {
          this.data.set(resp.data);
          this.message.set({ kind: 'ok', text: okText });
        },
        error: (err: { error?: { message?: string } }) =>
          this.message.set({
            kind: 'error',
            text: err?.error?.message ?? 'The change was not allowed.',
          }),
      });
  }

  entryTypeClass(entry: IRegistrationEntry): string {
    return `sreg-type sreg-type--${entry.type.toLowerCase()}`;
  }

  statusLabel(): string {
    switch (this.registration()?.status) {
      case 'ACTIVE':
        return 'Registered';
      case 'PENDING_CA_APPROVAL':
        return 'Awaiting Course Advisor approval';
      case 'NEEDS_ATTENTION':
        return 'Being reviewed by your Course Advisor';
      default:
        return '';
    }
  }
}
