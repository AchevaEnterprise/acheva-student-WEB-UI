import { Component, computed, input } from '@angular/core';
import { Svg } from '../../../../shared/svg/svg';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-password-validity',
  imports: [Svg, MatMenuModule, MatProgressBarModule],
  templateUrl: './password-validity.html',
  styleUrl: './password-validity.scss',
})
export class PasswordValidity {
  password = input<string>('');
  validity = computed(() => {
    const value = this.password() ?? '';
    return {
      contains1UpperCase: /[A-Z]/.test(value),
      contains1Number: /\d/.test(value),
      min8Characters: value.length >= 8,
    };
  });

  checkList = computed(() => {
    return [
      {
        label: 'At least 1 uppercase',
        valid: this.validity().contains1UpperCase,
      },
      {
        label: ' At least 1 number',
        valid: this.validity().contains1Number,
      },
      {
        label: 'At least 8 characters',
        valid: this.validity().min8Characters,
      },
    ];
  });
}
