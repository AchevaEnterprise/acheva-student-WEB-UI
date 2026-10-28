import { Component, computed, input } from '@angular/core';
import { Svg } from '../../../../shared/svg/svg';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';

/** The server's `IsStrongPassword` rule, so a form cannot submit what it will refuse. */
export const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,50}$/;

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
      contains1LowerCase: /[a-z]/.test(value),
      contains1Number: /\d/.test(value),
      contains1Symbol: /[^A-Za-z0-9]/.test(value),
      min8Characters: value.length >= 8,
    };
  });

  /**
   * Every rule the server enforces (`IsStrongPassword`). The list used to
   * stop at three, so "Password8" read as secure and was then refused.
   */
  isSecure = computed(() => Object.values(this.validity()).every(Boolean));

  checkList = computed(() => {
    return [
      {
        label: 'At least 1 uppercase',
        valid: this.validity().contains1UpperCase,
      },
      {
        label: 'At least 1 lowercase',
        valid: this.validity().contains1LowerCase,
      },
      {
        label: 'At least 1 number',
        valid: this.validity().contains1Number,
      },
      {
        label: 'At least 1 symbol (e.g. @ # ! ?)',
        valid: this.validity().contains1Symbol,
      },
      {
        label: 'At least 8 characters',
        valid: this.validity().min8Characters,
      },
    ];
  });
}
