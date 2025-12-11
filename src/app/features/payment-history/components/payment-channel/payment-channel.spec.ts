import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentChannel } from './payment-channel';

describe('PaymentChannel', () => {
  let component: PaymentChannel;
  let fixture: ComponentFixture<PaymentChannel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentChannel],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentChannel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
