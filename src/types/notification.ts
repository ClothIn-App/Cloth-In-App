export type NotificationType =
  | "follow"
  | "fitpic_like"
  | "fitpic_comment"
  | "product_like"
  | "product_comment";

export type NotificationEntityType = "fitpic" | "product" | "user";

export type NotificationItem = {
  id: string;
  userId: string;
  actorUserId: string;
  actorUsername: string;
  actorAvatarUrl?: string | null;
  type: NotificationType;
  entityType?: NotificationEntityType | null;
  entityId?: string | null;
  message?: string | null;
  isRead: boolean;
  createdAt: string;
};

export type NotificationsPagination = {
  hasMore: boolean;
  nextCursor?: string;
};

export type GetNotificationsResponse = {
  success: boolean;
  notifications: NotificationItem[];
  pagination?: NotificationsPagination | null;
};

export type MarkAllNotificationsReadResponse = {
  success: boolean;
  updated: number;
};
