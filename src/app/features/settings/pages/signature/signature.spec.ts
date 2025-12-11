import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Signature } from './signature';

describe('Signature', () => {
  let component: Signature;
  let fixture: ComponentFixture<Signature>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Signature],
    }).compileComponents();

    fixture = TestBed.createComponent(Signature);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
