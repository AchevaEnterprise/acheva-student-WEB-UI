import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { INotification } from '../../core/models/notification.model';
import { EmptyState } from '../empty-state/empty-state';

@Component({
  selector: 'app-notification',
  imports: [DatePipe, EmptyState],
  templateUrl: './notification.html',
  styleUrl: './notification.scss',
})
export class Notification {
  readonly data = inject<{ notifications: INotification[] }>(MAT_DIALOG_DATA);
}
