import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";

import { notificationsApiClient } from "../services/apiClients/notificationsClient";
import { useCurrentUserId } from "./useCurrentUserId";

/** Max notifications to scan for unread count (first page). */
const FETCH_LIMIT = 100;

/**
 * Returns approximate unread count from the latest notifications page.
 * If there are more than FETCH_LIMIT total, count may be capped for the badge.
 */
export function useUnreadNotificationCount() {
  const { userId } = useCurrentUserId();
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await notificationsApiClient.getNotifications({ limit: FETCH_LIMIT });
      const items = res.notifications ?? [];
      const unread = items.filter((n) => !n.isRead).length;
      setUnreadCount(unread);
    } catch {
      setUnreadCount(0);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { unreadCount, refresh };
}
