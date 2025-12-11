import { NgClass } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { LevelsEnum } from '../../core/models/school.model';

export interface ISegmentSwitcher {
  label: string;
  value: LevelsEnum;
}

@Component({
  selector: 'app-segment-switcher',
  imports: [NgClass],
  templateUrl: './segment-switcher.html',
  styleUrls: ['./segment-switcher.scss'],
})
export class SegmentSwitcher {
  activeSegment = input<ISegmentSwitcher>();
  segments = input<ISegmentSwitcher[]>();

  switchEvent = output<ISegmentSwitcher['value']>();

  switchSegment(value: ISegmentSwitcher['value']) {
    this.switchEvent.emit(value);
  }
}
