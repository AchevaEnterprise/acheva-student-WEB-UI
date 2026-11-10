import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import {
  IProgrammeOptionChoice,
  IStudentDetails,
  IStudentDetailsValues,
  IUpdateStudentDetails,
  MODE_OF_ENTRY_OPTIONS,
  ModeOfEntryEnum,
  NIGERIAN,
  NIGERIAN_STATES,
  SEX_OPTIONS,
  StudentSexEnum,
} from '../../core/models/student-details.model';
import { StudentService } from '../../core/services/student';
import { ToastService } from '../../core/utility/toast.service';
import { Button } from '../../shared/form/button/button';
import { Skeleton } from '../../shared/skeleton/skeleton';
import { Svg } from '../../shared/svg/svg';
import { AuthBanner } from '../auth/components/auth-banner/auth-banner';
import { AuthenticationService } from '../auth/services/auth.service';

type NationalityChoice = 'NIGERIAN' | 'OTHER';

/** Youngest a student can be; mirrors the server's check. */
const MIN_AGE_YEARS = 12;

/**
 * "Complete your details" — the transcript header's personal rows, asked for
 * once before the rest of the portal opens (`detailsGuard`), and reachable
 * again from Settings to correct one.
 */
@Component({
  selector: 'app-student-details',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    AuthBanner,
    Button,
    Skeleton,
    Svg,
  ],
  templateUrl: './student-details.html',
  styleUrl: './student-details.scss',
})
export class StudentDetails implements OnInit {
  private readonly students = inject(StudentService);
  private readonly auth = inject(AuthenticationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly sexOptions = SEX_OPTIONS;
  readonly modeOptions = MODE_OF_ENTRY_OPTIONS;
  readonly states = NIGERIAN_STATES;
  readonly maxDateOfBirth = isoDate(yearsAgo(MIN_AGE_YEARS));
  readonly minDateOfBirth = '1930-01-01';

  readonly loading = signal(true);
  readonly saving = signal(false);
  /** False on first visit; true when they have done it and came back to edit. */
  readonly editing = signal(false);
  /** The department's options (2026-11-09) — none means nothing is asked. */
  readonly programmeOptions = signal<readonly IProgrammeOptionChoice[]>([]);
  readonly optionLocked = signal(false);
  readonly lockedOptionName = signal<string | null>(null);

  /** Names are often stored in lower case; greet them the way they would write it. */
  readonly firstName = computed(() => {
    const first = (this.auth.activeAccount()?.fullName ?? '').trim().split(/\s+/)[0] ?? '';
    return first ? first.charAt(0).toUpperCase() + first.slice(1).toLowerCase() : '';
  });

  readonly form = new FormGroup({
    sex: new FormControl<StudentSexEnum | null>(null, Validators.required),
    dateOfBirth: new FormControl('', { nonNullable: true, validators: Validators.required }),
    nationality: new FormControl<NationalityChoice>('NIGERIAN', { nonNullable: true }),
    otherNationality: new FormControl('', { nonNullable: true }),
    stateOfOrigin: new FormControl('', { nonNullable: true, validators: Validators.required }),
    modeOfEntry: new FormControl<ModeOfEntryEnum | null>(null, Validators.required),
    programmeOptionId: new FormControl<string | null>(null),
  });

  readonly nationalityChoice = toSignal(this.form.controls.nationality.valueChanges, {
    initialValue: this.form.controls.nationality.value,
  });

  ngOnInit(): void {
    this.form.controls.nationality.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((choice) => this.onNationalityChange(choice));

    this.students
      .getMyDetails()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (resp) => {
          this.editing.set(!resp.data.required);
          this.adoptOptions(resp.data);
          this.prefill(resp.data.details);
        },
        // Nothing to prefill: the empty form is the right thing to show.
        error: () => undefined,
      });
  }

  /** The state list only means something for a Nigerian; anyone else types theirs. */
  private onNationalityChange(choice: NationalityChoice): void {
    const other = this.form.controls.otherNationality;
    other.setValidators(choice === 'OTHER' ? [Validators.required, Validators.maxLength(60)] : []);
    other.updateValueAndValidity({ emitEvent: false });
    this.form.controls.stateOfOrigin.setValue('');
  }

  /**
   * A department with options asks for one, from its list. Once recorded it
   * is shown, not offered again: fees differ by option, so a change goes
   * through Acheva support.
   */
  private adoptOptions(data: IStudentDetails): void {
    this.programmeOptions.set(data.options ?? []);
    this.optionLocked.set(!!data.optionLocked);
    this.lockedOptionName.set(data.optionLocked ? data.details.programmeOption : null);
    const control = this.form.controls.programmeOptionId;
    control.setValidators(data.options?.length && !data.optionLocked ? [Validators.required] : []);
    if (data.optionLocked) control.disable({ emitEvent: false });
    control.updateValueAndValidity({ emitEvent: false });
  }

  private prefill(details: IStudentDetailsValues): void {
    const nigerian = !details.nationality || details.nationality === NIGERIAN;
    this.form.controls.nationality.setValue(nigerian ? 'NIGERIAN' : 'OTHER');
    this.form.patchValue({
      sex: details.sex,
      dateOfBirth: details.dateOfBirth ? details.dateOfBirth.slice(0, 10) : '',
      otherNationality: nigerian ? '' : (details.nationality ?? ''),
      stateOfOrigin: details.stateOfOrigin ?? '',
      // UME is not offered any more; leaving it selected would show a blank.
      modeOfEntry: details.modeOfEntry === ModeOfEntryEnum.UME ? null : details.modeOfEntry,
      programmeOptionId: details.programmeOptionId ?? null,
    });
  }

  save(): void {
    if (this.saving()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    // Both are required controls, so a valid form has them.
    const body: IUpdateStudentDetails = {
      sex: value.sex as StudentSexEnum,
      dateOfBirth: value.dateOfBirth,
      nationality: value.nationality === 'NIGERIAN' ? NIGERIAN : value.otherNationality.trim(),
      stateOfOrigin: value.stateOfOrigin.trim(),
      modeOfEntry: value.modeOfEntry as ModeOfEntryEnum,
      // A locked option is disabled, so `getRawValue` still carries it.
      programmeOptionId: this.programmeOptions().length ? value.programmeOptionId : null,
    };

    this.saving.set(true);
    this.students
      .updateMyDetails(body)
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (resp) => {
          this.auth.setDetailsRequired(resp.data.required);
          this.toast.showNotification(
            'success',
            this.editing() ? 'Details updated' : 'All set',
            this.editing()
              ? 'Your academic record will print the new details.'
              : 'Thank you. Your details are saved.'
          );
          void this.router.navigateByUrl(this.destination());
        },
        // The error interceptor already shows the server's reason.
      });
  }

  cancel(): void {
    void this.router.navigateByUrl('/settings/profile');
  }

  signOut(): void {
    this.auth.logOut();
  }

  /** Back where they were going — never off-site, never back to this form. */
  private destination(): string {
    if (this.editing()) return '/settings/profile';
    const next = this.route.snapshot.queryParamMap.get('next') ?? '';
    const safe = next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/details');
    return safe ? next : '/dashboard';
  }

  showError(control: keyof typeof this.form.controls): boolean {
    const field = this.form.controls[control];
    return field.invalid && field.touched;
  }
}

function yearsAgo(years: number): Date {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  return date;
}

/** Local calendar date as `YYYY-MM-DD` — what a date input speaks. */
function isoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
