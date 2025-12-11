import { Component } from '@angular/core';
import { StatusBadge } from '../../../../shared/status-badge/status-badge';

@Component({
  selector: 'app-payment-list',
  imports: [StatusBadge],
  templateUrl: './payment-list.html',
  styleUrl: './payment-list.scss',
})
export class PaymentList {}
