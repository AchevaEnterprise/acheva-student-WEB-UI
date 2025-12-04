import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthBanner } from './auth-banner';

describe('AuthBanner', () => {
  let component: AuthBanner;
  let fixture: ComponentFixture<AuthBanner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthBanner],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthBanner);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
