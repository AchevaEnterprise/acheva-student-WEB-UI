export type AppNotificationType = 'success' | 'warning' | 'error';

export interface IAppNotification {
  type: AppNotificationType;
  title: string;
  message: string;
}

export interface INotification {
  title: string;
  message: string;
  createdAt: Date;
  status: 'READ' | 'UNREAD';
}

