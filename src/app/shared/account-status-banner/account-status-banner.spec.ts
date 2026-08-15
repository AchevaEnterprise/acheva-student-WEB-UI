import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { IStudentProfile } from '../../core/models/student.model';
import { AccountStatusBanner } from './account-status-banner';

function profileWith(isActive: boolean, deactivatedAt: Date | null): IStudentProfile {
  return {
    courseAdviserName: 'Dr. Ada Obi',
    departmentalDues: 0,
    cgpa: 4.1,
    coursesEnrolled: 8,
    student: { isActive, deactivatedAt } as IStudentProfile['student'],
  };
}

describe('AccountStatusBanner', () => {
  let fixture: ComponentFixture<AccountStatusBanner>;
  let component: AccountStatusBanner;

  async function setup(profile: IStudentProfile | null) {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [AccountStatusBanner],
      providers: [
        // The app runs zoneless; TestBed still defaults to requiring Zone.js.
        provideZonelessChangeDetection(),
        provideMockStore({ initialState: { profile: { profile, error: null, isLoading: false } } }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountStatusBanner);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', async () => {
    await setup(null);
    expect(component).toBeTruthy();
  });

  it('stays hidden while the profile has not loaded', async () => {
    await setup(null);
    expect(component.isDeactivated()).toBe(false);
    expect(fixture.nativeElement.querySelector('.account-banner')).toBeNull();
  });

  it('stays hidden for an active student', async () => {
    await setup(profileWith(true, null));
    expect(component.isDeactivated()).toBe(false);
  });

  it('renders for a deactivated student', async () => {
    await setup(profileWith(false, new Date('2026-03-01')));
    expect(component.isDeactivated()).toBe(true);
    expect(fixture.nativeElement.querySelector('.account-banner')).not.toBeNull();
  });

  it('renders without a date when deactivatedAt is missing', async () => {
    await setup(profileWith(false, null));
    expect(component.isDeactivated()).toBe(true);
    expect(component.deactivatedAt()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('before your account was');
  });
});
