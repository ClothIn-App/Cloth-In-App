import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  onPress: () => void;
  unreadCount: number;
  testID?: string;
};

/**
 * Bell icon with optional numeric badge (top-right). Caps display at 99+.
 */
export function NotificationBellButton({ onPress, unreadCount, testID }: Props) {
  const showBadge = unreadCount > 0;
  const label = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      style={styles.wrap}
      hitSlop={8}
      accessibilityLabel="Notifications"
      accessibilityHint={
        showBadge ? `${unreadCount} unread notifications` : "Notifications"
      }
    >
      <Ionicons name="notifications-outline" size={24} color="#11181C" />
      {showBadge ? (
        <View style={styles.badge} accessibilityElementsHidden>
          <Text style={styles.badgeText}>{label}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
});
