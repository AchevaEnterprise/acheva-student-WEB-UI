import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Registration } from './registration';
import {
  IMyRegistration,
  ISelfRegistrationOptions,
  RegistrationService,
} from './registration.service';

/**
 * Students register their own courses (product decision 2026-08-14). The CA
 * no longer initiates registration; anyone who misses the school's deadline
 * is swept automatically by the backend.
 *
 * The rules these tests hold: compulsory courses and anything already owed
 * are added FOR the student, elective groups are a single choice each, and
 * the unit total is visible before they commit.
 */

const emptyRegistration: IMyRegistration = {
  registration: null,
  settings: {
    activeSession: '2027/2028',
    activeSemester: '1ST SEMESTER',
    registrationGraceDays: 60,
  },
  grace: null,
  electiveOptions: [],
  excusedCourses: [],
};

function options(overrides: Partial<ISelfRegistrationOptions> = {}): ISelfRegistrationOptions {
  return {
    blocked: false,
    session: '2027/2028',
    semester: '1ST SEMESTER',
    level: '300',
    deadline: '2027-10-15T00:00:00.000Z',
    minUnits: 15,
    maxUnits: 24,
    fixed: [
      {
        courseId: 'f1',
        courseCode: 'CSC301',
        courseTitle: 'Algorithms',
        units: 3,
        type: 'COMPULSORY',
      },
    ],
    carryOvers: [
      {
        courseId: 'co1',
        courseCode: 'MTH201',
        courseTitle: 'Calculus II',
        units: 3,
      },
    ],
    excused: [
      {
        courseId: 'ex1',
        courseCode: 'PHY201',
        courseTitle: 'Mechanics',
        units: 2,
      },
    ],
    electiveGroups: [
      {
        group: 'A',
        minRequired: 1,
        options: [
          {
            courseId: 'e1',
            courseCode: 'CSC311',
            courseTitle: 'Graphics',
            units: 3,
            type: 'ELECTIVE',
          },
          {
            courseId: 'e2',
            courseCode: 'CSC312',
            courseTitle: 'Networks',
            units: 3,
            type: 'ELECTIVE',
          },
        ],
      },
    ],
    optionalElectives: [
      {
        courseId: 'o1',
        courseCode: 'GST301',
        courseTitle: 'Entrepreneurship',
        units: 2,
        type: 'ELECTIVE',
      },
    ],
    ...overrides,
  };
}

describe('Registration — student self-registration', () => {
  let fixture: ComponentFixture<Registration>;
  let component: Registration;
  let submitted: string[][];
  let failNext: boolean;

  async function setup(opts: ISelfRegistrationOptions) {
    submitted = [];
    failNext = false;

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [Registration],
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: RegistrationService,
          useValue: {
            me: () => of({ data: emptyRegistration }),
            options: () => of({ data: opts }),
            editElectives: () => of({ data: emptyRegistration }),
            selfRegister: (ids: string[]) => {
              submitted.push(ids);
              return failNext
                ? throwError(() => ({ error: { message: 'Group A requires 1' } }))
                : of({ data: null });
            },
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

  beforeEach(async () => {
    await setup(options());
  });

  it('offers the register flow when the student has no registration', () => {
    expect(component.canSelfRegister()).toBe(true);
    expect(fixture.nativeElement.querySelector('.sreg-register')).not.toBeNull();
  });

  it('shows the deadline and says the school registers you if you miss it', () => {
    expect(text()).toContain('register you');
    expect(text()).toContain('automatically');
  });

  it('lists required courses as added for the student, not chosen', () => {
    expect(text()).toContain('Required courses (added for you)');
    expect(text()).toContain('CSC301');
  });

  it('lists carry-overs and excused courses as already owed', () => {
    expect(text()).toContain('already owe');
    expect(text()).toContain('MTH201');
    expect(text()).toContain('PHY201');
    expect(text()).toContain('carry-over');
    expect(text()).toContain('excused earlier');
  });

  describe('unit total', () => {
    it('counts fixed and owed courses before any choice is made', () => {
      // 3 fixed + 3 carry-over + 2 excused
      expect(component.selectedUnits()).toBe(8);
    });

    it('adds the units of chosen electives', () => {
      component.chooseInGroup('A', 'e1');
      expect(component.selectedUnits()).toBe(11);

      component.togglePick('o1');
      expect(component.selectedUnits()).toBe(13);
    });
  });

  describe('elective group choice', () => {
    it('keeps only one pick per required group', () => {
      component.chooseInGroup('A', 'e1');
      expect(component.isPicked('e1')).toBe(true);

      component.chooseInGroup('A', 'e2');
      expect(component.isPicked('e2')).toBe(true);
      expect(component.isPicked('e1')).toBe(false);
    });

    it('allows optional electives to be toggled independently', () => {
      component.togglePick('o1');
      expect(component.isPicked('o1')).toBe(true);
      component.togglePick('o1');
      expect(component.isPicked('o1')).toBe(false);
    });
  });

  describe('submitting', () => {
    it('sends only the elective choices — fixed courses are the backend’s job', () => {
      component.chooseInGroup('A', 'e2');
      component.togglePick('o1');
      component.submitRegistration();

      expect(submitted).toEqual([['e2', 'o1']]);
    });

    it('confirms success to the student', () => {
      component.chooseInGroup('A', 'e1');
      component.submitRegistration();
      expect(component.message()?.kind).toBe('ok');
    });

    it('surfaces the backend’s reason when the selection is illegal', () => {
      failNext = true;
      component.submitRegistration();

      expect(component.message()?.kind).toBe('error');
      expect(component.message()?.text).toContain('Group A requires 1');
    });
  });

  describe('when registration is not open to the student', () => {
    it('explains why instead of offering the form', async () => {
      await setup(
        options({
          blocked: true,
          reason: 'The registration deadline has passed.',
        }) as ISelfRegistrationOptions
      );

      expect(component.canSelfRegister()).toBe(false);
      expect(component.blockedReason()).toContain('deadline has passed');
      expect(fixture.nativeElement.querySelector('.sreg-register')).toBeNull();
      expect(text()).toContain('deadline has passed');
    });
  });
});
