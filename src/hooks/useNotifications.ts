import { useCallback, useEffect, useState } from "react";

import type { NotificationItem } from "../types/notification";
import { notificationsApiClient } from "../services/apiClients/notificationsClient";

const PAGE_SIZE = 20;

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await notificationsApiClient.getNotifications({ limit: PAGE_SIZE });
      setNotifications(res.notifications || []);
      setHasMore(Boolean(res.pagination?.hasMore));
      setNextCursor(res.pagination?.nextCursor);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await notificationsApiClient.getNotifications({ limit: PAGE_SIZE });
      setNotifications(res.notifications || []);
      setHasMore(Boolean(res.pagination?.hasMore));
      setNextCursor(res.pagination?.nextCursor);
    } catch (e: any) {
      setError(e?.message ?? "Failed to refresh notifications.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || loading || !hasMore || !nextCursor) {
      return;
    }
    setLoadingMore(true);
    try {
      const res = await notificationsApiClient.getNotifications({
        limit: PAGE_SIZE,
        cursor: nextCursor,
      });
      setNotifications((prev) => [...prev, ...(res.notifications || [])]);
      setHasMore(Boolean(res.pagination?.hasMore));
      setNextCursor(res.pagination?.nextCursor);
    } catch {
      // Keep existing list visible even if loading next page fails.
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loading, loadingMore, nextCursor]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  return {
    notifications,
    loading,
    refreshing,
    loadingMore,
    error,
    hasMore,
    refresh,
    loadMore,
    retry: loadInitial,
  };
}
