import { Component, input } from '@angular/core';
import { IAnalytics } from '../../../../core/models/school.model';
import { Svg } from '../../../../shared/svg/svg';

@Component({
  selector: 'app-analytics-card',
  imports: [Svg],
  templateUrl: './analytics-card.html',
  styleUrl: './analytics-card.scss',
})
export class AnalyticsCard {
  analtyics = input<IAnalytics>();
}
