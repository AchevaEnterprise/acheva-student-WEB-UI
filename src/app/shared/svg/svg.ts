import { NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-svg',
  imports: [NgClass],
  template: `<img
    [src]="src"
    class="block"
    [ngClass]="svgClass"
    [style.width]="svgWidth"
    [style.height]="svgHeight"
    alt="Svg"
  /> `,
})
export class Svg {
  @Input() src!: string;
  @Input() svgClass?: string;
  @Input() svgWidth = '100%';
  @Input() svgHeight = '100%';
}
