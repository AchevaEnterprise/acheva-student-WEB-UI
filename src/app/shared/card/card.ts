import { Component, input } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { Svg } from '../svg/svg';

@Component({
  selector: 'app-card',
  imports: [MatDividerModule, Svg],
  templateUrl: './card.html',
  styleUrl: './card.scss',
})
export class Card {
  label = input<string>();
  description = input<string>();
  iconSrc = input<string>();
  showDivider = input<boolean>(false);
  dividerClass = input<string>();
}
