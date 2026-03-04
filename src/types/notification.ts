export interface UserNotificationItem {
  id: string;
  type: string;
  title: string;
  message: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
}

