import { Component } from '@angular/core';
import { StatusBadge } from '../../../../shared/status-badge/status-badge';
import { Svg } from '../../../../shared/svg/svg';

@Component({
  selector: 'app-payment-list',
  imports: [StatusBadge, Svg],
  templateUrl: './payment-list.html',
  styleUrl: './payment-list.scss',
})
export class PaymentList {}
