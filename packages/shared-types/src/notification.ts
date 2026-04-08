export enum NotificationType {
  BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  DOCUMENT_REQUESTED = 'DOCUMENT_REQUESTED',
  BID_RECEIVED = 'BID_RECEIVED',
  BID_ACCEPTED = 'BID_ACCEPTED',
  BID_REJECTED = 'BID_REJECTED',
  LOAD_CANCELLED = 'LOAD_CANCELLED',
  NEW_MESSAGE = 'NEW_MESSAGE',
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
}
