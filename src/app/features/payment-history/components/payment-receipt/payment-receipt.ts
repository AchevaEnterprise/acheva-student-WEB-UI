import { CurrencyPipe } from '@angular/common';
import { Component } from '@angular/core';
import { ImageFallbackDirective } from '../../../../core/directives/image-fallback.directive';

@Component({
  selector: 'app-payment-receipt',
  imports: [CurrencyPipe, ImageFallbackDirective],
  templateUrl: './payment-receipt.html',
  styleUrl: './payment-receipt.scss',
})
export class PaymentReceipt {}
