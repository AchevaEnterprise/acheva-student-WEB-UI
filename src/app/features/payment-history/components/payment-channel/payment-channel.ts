import { CurrencyPipe } from '@angular/common';
import { Component } from '@angular/core';
import { MatDivider } from '@angular/material/divider';
import { Button } from '../../../../shared/form/button/button';
import { PaymentReceipt } from "../payment-receipt/payment-receipt";

@Component({
  selector: 'app-payment-channel',
  imports: [MatDivider, CurrencyPipe, Button, PaymentReceipt],
  templateUrl: './payment-channel.html',
  styleUrl: './payment-channel.scss',
})
export class PaymentChannel {}
