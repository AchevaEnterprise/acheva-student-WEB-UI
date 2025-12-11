import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentReceipt } from './payment-receipt';

describe('PaymentReceipt', () => {
  let component: PaymentReceipt;
  let fixture: ComponentFixture<PaymentReceipt>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentReceipt],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentReceipt);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
