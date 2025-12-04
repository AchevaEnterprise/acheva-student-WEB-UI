import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PasswordValidity } from './password-validity';

describe('PasswordValidity', () => {
  let component: PasswordValidity;
  let fixture: ComponentFixture<PasswordValidity>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PasswordValidity],
    }).compileComponents();

    fixture = TestBed.createComponent(PasswordValidity);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
