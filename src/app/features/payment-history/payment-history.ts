import { Component } from '@angular/core';
import { PaymentList } from './components/payment-list/payment-list';
import { PaymentChannel } from './components/payment-channel/payment-channel';
import { PaymentReceipt } from './components/payment-receipt/payment-receipt';

@Component({
  selector: 'app-payment-history',
  imports: [PaymentList, PaymentChannel, PaymentReceipt],
  templateUrl: './payment-history.html',
  styleUrl: './payment-history.scss',
})
export class PaymentHistory {}
