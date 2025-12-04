import { Component, input } from '@angular/core';
import { Svg } from '../../../../shared/svg/svg';

@Component({
  selector: 'app-auth-banner',
  imports: [Svg],
  templateUrl: './auth-banner.html',
  styleUrl: './auth-banner.scss',
})
export class AuthBanner {
  title = input<string>('');
  description = input<string>('');
}
