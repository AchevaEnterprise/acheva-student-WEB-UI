import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatRippleModule } from '@angular/material/core';
import { MatFormFieldModule, MatPrefix, MatSuffix } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { debounceTime, distinctUntilChanged, finalize, Subscription } from 'rxjs';
import { IDepartment, IFaculty, ISchool, LevelsEnum } from '../../../../core/models/school.model';
import { AppState } from '../../../../core/store/app.state';
import {
  loadDepartments,
  loadFaculties,
  loadSchools,
} from '../../../../core/store/school/school.action';
import {
  departmentsSelector,
  facultiesSelector,
  schoolsSelector,
} from '../../../../core/store/school/school.selector';
import { ToastService } from '../../../../core/utility/toast.service';
import { UtilityService } from '../../../../core/utility/utility.service';
import { Button } from '../../../../shared/form/button/button';
import { Svg } from '../../../../shared/svg/svg';
import { AuthBanner } from '../../components/auth-banner/auth-banner';
import { PasswordValidity } from '../../components/password-validity/password-validity';
import { ISignUp } from '../../models/auth.model';
import { AuthenticationService } from '../../services/auth.service';

@Component({
  selector: 'app-sign-up',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatRippleModule,
    MatIconModule,
    MatSelectModule,
    Svg,
    AuthBanner,
    MatSuffix,
    MatPrefix,
    Button,
    PasswordValidity,
  ],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.scss',
})
export class SignUp implements OnInit, OnDestroy {
  private readonly authService = inject(AuthenticationService);
  private readonly toast = inject(ToastService);
  private readonly store = inject(Store<AppState>);

  private readonly utilsService = inject(UtilityService);
  private readonly router = inject(Router);

  isLoading = signal(false);

  schoolsOptions = signal<ISchool[]>([]);
  facultiesOptions = signal<IFaculty[]>([]);
  departmentsOptions = signal<IDepartment[]>([]);
  admissionYearOptions = signal<string[]>(this.utilsService.generateAdmissionYear());

  levelOptions = signal<{ label: string; value: LevelsEnum }[]>([
    {
      label: '100 Level',
      value: LevelsEnum.YEAR_ONE,
    },
    {
      label: '200 Level',
      value: LevelsEnum.YEAR_TWO,
    },
    {
      label: '300 Level',
      value: LevelsEnum.YEAR_THREE,
    },
    {
      label: '400 Level',
      value: LevelsEnum.YEAR_FOUR,
    },
    {
      label: '500 Level',
      value: LevelsEnum.YEAR_FIVE,
    },
    {
      label: '600 Level',
      value: LevelsEnum.YEAR_SIX,
    },
    {
      label: 'Reference',
      value: LevelsEnum.REFERENCE,
    },
    {
      label: 'Unregistered',
      value: LevelsEnum.UNREGISTERED,
    },
  ]);
  sessionOptions = signal<string[]>(this.utilsService.generateSchoolSessions());

  private readonly sub: Subscription = new Subscription();

  form: FormGroup = new FormGroup({
    fullname: new FormControl(null, Validators.required),
    email: new FormControl(null, [Validators.required, Validators.email]),
    registrationNumber: new FormControl(null, Validators.required),
    school: new FormControl(null, Validators.required),
    faculty: new FormControl(null, Validators.required),
    department: new FormControl(null, Validators.required),
    admissionYear: new FormControl(null, Validators.required),
    level: new FormControl(null, Validators.required),
    password: new FormControl(null, Validators.required),
    confirm_password: new FormControl(null, Validators.required),
  });

  showPassword = signal<boolean>(false);
  showConfirmPassword = signal<boolean>(false);

  ngOnInit(): void {
    this.regNoListener();
    this.getSchools();
  }

  togglePasswordVisibility() {
    this.showPassword.update((val) => !val);
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword.update((val) => !val);
  }

  getSchools() {
    this.store.dispatch(loadSchools());
    this.sub.add(
      this.store.select(schoolsSelector).subscribe({
        next: (schools) => {
          this.schoolsOptions.set(schools);
        },
      }),
    );
  }

  getFaculties(event: MatSelectChange) {
    const schoolId = event.value as string;
    this.store.dispatch(loadFaculties({ schoolId }));
    this.sub.add(
      this.store.select(facultiesSelector).subscribe({
        next: (faculties) => {
          this.facultiesOptions.set(faculties);
        },
      }),
    );
  }

  getDepartments(event: MatSelectChange | string) {
    const facultyId = typeof event === 'string' ? event : (event.value as string);
    this.store.dispatch(loadDepartments({ facultyId }));
    this.sub.add(
      this.store.select(departmentsSelector).subscribe({
        next: (departments) => {
          this.departmentsOptions.set(departments);
        },
      }),
    );
  }

  regNoListener() {
    this.form.controls['registrationNumber'].valueChanges
      .pipe(distinctUntilChanged(), debounceTime(800))
      .subscribe({
        next: (regNo) => {
          const school = this.form.controls['school'].value;
          this.getStudentInfoByRegNo(regNo, school);
        },
      });
  }

  getStudentInfoByRegNo(regNo: string, school: string) {
    this.authService.getStudentProfileByRegNo(regNo, school).subscribe({
      next: (resp) => {
        const { fullName, admissionYear, level, faculty, department } = resp.data;
        this.form.patchValue({
          fullname: fullName,
          admissionYear: admissionYear,
          level: level,
          faculty: faculty._id,
          department: department._id,
        });

        if (faculty) this.getDepartments(faculty._id);
      },
    });
  }

  compareFacultyFn(faculty1: IFaculty, faculty2: IFaculty) {
    return faculty1 && faculty2 ? faculty1._id === faculty2._id : faculty1 === faculty2;
  }

  compareDepartmentFn(department1: IDepartment, department2: IDepartment) {
    return department1 && department2
      ? department1._id === department2._id
      : department1 === department2;
  }

  submitForm() {
    const {
      fullname,
      email,
      school,
      faculty,
      department,
      registrationNumber,
      password,
      confirm_password,
      session,
      level,
    } = this.form.value as {
      fullname: string;
      email: string;
      school: string;
      faculty: string;
      department: string;
      registrationNumber: string;
      password: string;
      confirm_password: string;
      session: string;
      level: LevelsEnum;
    };

    if (password !== confirm_password) {
      this.toast.showNotification('warning', 'Password Mismatch', 'Passwords do not match', 5);

      return;
    }

    this.isLoading.set(true);
    const payload: ISignUp = {
      fullName: fullname,
      registrationNumber,
      email,
      password,
      confirmPassword: confirm_password,
      faculty,
      department,
      school,
      session,
      level,
    };

    this.sub.add(
      this.authService
        .signUp(payload)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          next: (res) => {
            if (res.status) {
              this.toast.showNotification(
                'success',
                'Account Created',
                'Your account was created successfully',
              );
              this.router.navigate(['/auth/confirm-email'], {
                queryParams: { accountId: (res.data as { _id: string })._id },
              });
            }
          },
          error: (err) => {
            this.toast.showNotification(
              'error',
              'Account Creation Failed',
              err?.error?.message || 'Something went wrong',
            );
          },
        }),
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
