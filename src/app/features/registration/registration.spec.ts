import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Registration } from './registration';
import {
  IMyRegistration,
  IOutstandingExcusedCourse,
  RegistrationService,
} from './registration.service';

/**
 * The student's view of courses they were excused from.
 *
 * The rule (registrar, 2026-08-14): an excused course costs nothing on the
 * CGPA, is NOT a carry-over, but is still owed. The whole point of showing it
 * is that the obligation must never be a surprise at graduation — so these
 * tests assert the wording as much as the rendering.
 */

function excused(overrides: Partial<IOutstandingExcusedCourse> = {}): IOutstandingExcusedCourse {
  return {
    courseId: 'c1',
    courseCode: 'MTH301',
    courseTitle: 'Linear Algebra',
    units: 3,
    courseSemester: '1ST SEMESTER',
    originalType: 'COMPULSORY',
    excusedInSession: '2026/2027',
    excusedInLevel: '300',
    excusedAt: null,
    ...overrides,
  };
}

function payload(excusedCourses: IOutstandingExcusedCourse[]): IMyRegistration {
  return {
    registration: {
      _id: 'r1',
      session: '2027/2028',
      semester: '1ST SEMESTER',
      level: '400',
      status: 'ACTIVE',
      totalUnits: 18,
      nonSiwesUnits: 18,
      entries: [],
    },
    settings: {
      activeSession: '2027/2028',
      activeSemester: '1ST SEMESTER',
      registrationGraceDays: 60,
    },
    grace: { editableUntil: '2027-10-01', daysLeft: 5, canEdit: true },
    electiveOptions: [],
    excusedCourses,
  };
}

describe('Registration — excused courses', () => {
  let fixture: ComponentFixture<Registration>;
  let component: Registration;

  async function setup(excusedCourses: IOutstandingExcusedCourse[]) {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [Registration],
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: RegistrationService,
          useValue: {
            me: () => of({ data: payload(excusedCourses) }),
            editElectives: () => of({ data: payload(excusedCourses) }),
            options: () => of({ data: { blocked: true, reason: 'n/a' } }),
            selfRegister: () => of({ data: null }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Registration);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  const text = () => fixture.nativeElement.textContent as string;

  it('shows nothing when the student has no excused courses', async () => {
    await setup([]);
    expect(component.excusedCourses()).toEqual([]);
    expect(fixture.nativeElement.querySelector('.sreg-outstanding')).toBeNull();
  });

  it('lists an excused course the student still owes', async () => {
    await setup([excused()]);

    expect(fixture.nativeElement.querySelector('.sreg-outstanding')).not.toBeNull();
    expect(text()).toContain('MTH301');
    expect(text()).toContain('Linear Algebra');
  });

  it('says explicitly that it is not a carry-over', async () => {
    await setup([excused()]);
    expect(text()).toContain('not carry-overs');
  });

  it('says the student must still take it', async () => {
    await setup([excused()]);
    expect(text()).toContain('must still take');
  });

  it('reassures that the CGPA was not affected', async () => {
    await setup([excused()]);
    expect(text()).toContain('did not affect your CGPA');
  });

  it('shows where the excusal happened so it can be queried', async () => {
    await setup([excused()]);
    expect(text()).toContain('2026/2027');
    expect(text()).toContain('300');
  });

  it('counts multiple outstanding courses', async () => {
    await setup([excused(), excused({ courseId: 'c2', courseCode: 'PHY201', units: 2 })]);

    expect(component.excusedCourses().length).toBe(2);
    expect(text()).toContain('(2)');
    expect(text()).toContain('PHY201');
  });
});
