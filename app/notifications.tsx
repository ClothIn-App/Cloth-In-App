// app/notifications.tsx
import * as React from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useNotifications } from "../src/hooks/useNotifications";
import { notificationsApiClient } from "../src/services/apiClients/notificationsClient";
import type { NotificationItem } from "../src/types/notification";
import { openUserProfile } from "../src/navigation/openUserProfile";

function formatRelativeTime(iso: string): string {
  const date = new Date(iso).getTime();
  if (Number.isNaN(date)) return "";
  const diffMs = Math.max(0, Date.now() - date);
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}

function buildNotificationText(item: NotificationItem): string {
  if (item.message) return item.message;
  switch (item.type) {
    case "follow":
      return "started following you";
    case "fitpic_like":
      return "liked your fitpic";
    case "fitpic_comment":
      return "commented on your fitpic";
    case "product_like":
      return "liked your product";
    case "product_comment":
      return "commented on your product";
    default:
      return "interacted with your content";
  }
}

function NotificationsContent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    notifications,
    loading,
    refreshing,
    loadingMore,
    error,
    hasMore,
    refresh,
    loadMore,
    retry,
  } = useNotifications();

  const markInFlight = React.useRef(false);

  React.useEffect(() => {
    if (loading || error) return;
    if (!notifications.some((n) => !n.isRead)) return;
    if (markInFlight.current) return;
    markInFlight.current = true;
    let cancelled = false;
    (async () => {
      try {
        await notificationsApiClient.markAllNotificationsRead();
        if (!cancelled) await refresh();
      } catch {
        // Keep list as-is; user can pull to refresh.
      } finally {
        if (!cancelled) markInFlight.current = false;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, error, notifications, refresh]);

  const handleClose = React.useCallback(() => {
    router.back();
  }, [router]);

  const handlePressNotification = React.useCallback(
    (item: NotificationItem) => {
      if (item.type === "follow") {
        const targetUserId = item.actorUserId || item.entityId;
        if (!targetUserId) return;
        openUserProfile(targetUserId);
        return;
      }

      if ((item.type === "fitpic_like" || item.type === "fitpic_comment") && item.entityId) {
        router.push({
          pathname: "/fitpic-detail",
          params: { id: item.entityId },
        } as any);
        return;
      }

      if ((item.type === "product_like" || item.type === "product_comment") && item.entityId) {
        router.push({
          pathname: "/product-detail",
          params: { id: item.entityId, source: "notifications" },
        } as any);
      }
    },
    [router]
  );

  const topPad = Math.max(insets.top - 6, 0);
  const headerHeight = 60 + topPad;

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <Pressable
      testID={`notification-row-${item.id}`}
      style={styles.row}
      onPress={() => handlePressNotification(item)}
    >
      <View style={styles.avatarPlaceholder}>
        <Ionicons name="person" size={16} color="#6b7280" />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowText}>
          <Text style={styles.actorName}>{item.actorUsername || "Someone"}</Text>{" "}
          {buildNotificationText(item)}
        </Text>
        <Text style={styles.timeText}>{formatRelativeTime(item.createdAt)}</Text>
      </View>
      {!item.isRead ? <View style={styles.unreadDot} /> : null}
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <View style={[styles.header, { paddingTop: topPad, height: headerHeight }]}>
        <Pressable onPress={handleClose} hitSlop={8} style={styles.headerButton}>
          <Ionicons name="chevron-back-sharp" size={24} color="#000000" />
        </Pressable>

        <Text style={styles.headerTitle}>Notifications</Text>

        <View style={styles.headerButton} />
      </View>

      {loading ? (
        <View testID="notifications-loading" style={styles.centerState}>
          <ActivityIndicator />
          <Text style={styles.stateText}>Loading notifications...</Text>
        </View>
      ) : error ? (
        <View testID="notifications-error" style={styles.centerState}>
          <Text style={styles.errorTitle}>Couldn't load notifications.</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={retry}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : notifications.length === 0 ? (
        <View testID="notifications-empty" style={styles.centerState}>
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptySubtitle}>
            Follows, likes, and comments will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          testID="notifications-list"
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (hasMore) loadMore();
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} />
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoading}>
                <ActivityIndicator size="small" />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerButton: {
    padding: 8,
    minWidth: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  stateText: {
    marginTop: 8,
    color: "#6b7280",
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  errorSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#111827",
  },
  retryText: {
    color: "#fff",
    fontWeight: "600",
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  emptySubtitle: {
    textAlign: "center",
    color: "#6b7280",
  },
  listContent: {
    paddingBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    gap: 10,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: {
    flex: 1,
  },
  rowText: {
    color: "#111827",
    fontSize: 14,
    lineHeight: 20,
  },
  actorName: {
    fontWeight: "700",
  },
  timeText: {
    marginTop: 2,
    color: "#9ca3af",
    fontSize: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#3b82f6",
  },
  footerLoading: {
    paddingVertical: 14,
  },
});

export default function NotificationsScreen() {
  return <NotificationsContent />;
}
