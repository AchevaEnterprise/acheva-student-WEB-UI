import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Svg } from '../../svg/svg';

@Component({
  selector: 'app-button',
  imports: [MatProgressSpinnerModule, MatButtonModule, MatFormFieldModule, Svg],
  templateUrl: './button.html',
  styleUrl: './button.scss',
})
export class Button {
  loading = input<boolean>(false);
  disabled = input<boolean>(false);
  label = input<string>('');
  type = input<'clear' | 'outline' | 'fill'>('fill');
  class = input<string>('');
  icon = input<string>('');

  clickEvent = output();

  onBtnclick() {
    this.clickEvent.emit();
  }
}
