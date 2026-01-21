import { Component } from '@angular/core';
import { PaymentChannel } from './components/payment-channel/payment-channel';
import { PaymentList } from './components/payment-list/payment-list';

@Component({
  selector: 'app-payment-history',
  imports: [PaymentList, PaymentChannel],
  templateUrl: './payment-history.html',
  styleUrl: './payment-history.scss',
})
export class PaymentHistory {}
