import { Component, input } from '@angular/core';

import { DatePipe } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { INotification } from '../../../../core/models/notification.model';

export interface IActivity {
  type: 'submit' | 'add' | 'reminder' | 'edit';
  message: string;
  date: Date;
}

@Component({
  selector: 'app-activity',
  imports: [MatDividerModule, DatePipe],
  templateUrl: './activity.html',
  styleUrl: './activity.scss',
})
export class Activity {
  activity = input<INotification>();
}
