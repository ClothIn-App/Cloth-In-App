import React from "react";
import { Pressable, Text, View } from "react-native";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import { useNotifications } from "@/src/hooks/useNotifications";
import { notificationsApiClient } from "@/src/services/apiClients/notificationsClient";

jest.mock("@/src/services/apiClients/notificationsClient", () => ({
  notificationsApiClient: {
    getNotifications: jest.fn(),
  },
}));

function HookHarness() {
  const {
    notifications,
    loading,
    error,
    hasMore,
    refresh,
    loadMore,
  } = useNotifications();

  return (
    <View>
      <Text testID="loading">{String(loading)}</Text>
      <Text testID="count">{String(notifications.length)}</Text>
      <Text testID="hasMore">{String(hasMore)}</Text>
      <Text testID="error">{error ?? ""}</Text>
      <Pressable testID="refresh" onPress={refresh}>
        <Text>refresh</Text>
      </Pressable>
      <Pressable testID="loadMore" onPress={loadMore}>
        <Text>loadMore</Text>
      </Pressable>
    </View>
  );
}

describe("useNotifications", () => {
  const mockedGetNotifications = notificationsApiClient.getNotifications as jest.Mock;

  beforeEach(() => {
    mockedGetNotifications.mockReset();
  });

  test("loads initial notifications and empty state", async () => {
    mockedGetNotifications.mockResolvedValueOnce({
      success: true,
      notifications: [],
      pagination: { hasMore: false },
    });

    const screen = render(<HookHarness />);

    await waitFor(() => {
      expect(screen.getByTestId("loading").props.children).toBe("false");
    });
    expect(screen.getByTestId("count").props.children).toBe("0");
    expect(screen.getByTestId("hasMore").props.children).toBe("false");
  });

  test("sets error when initial request fails", async () => {
    mockedGetNotifications.mockRejectedValueOnce(new Error("boom"));
    const screen = render(<HookHarness />);

    await waitFor(() => {
      expect(screen.getByTestId("loading").props.children).toBe("false");
    });
    expect(screen.getByTestId("error").props.children).toContain("boom");
  });

  test("supports pagination via loadMore", async () => {
    mockedGetNotifications
      .mockResolvedValueOnce({
        success: true,
        notifications: [
          {
            id: "n1",
            userId: "u1",
            actorUserId: "u2",
            actorUsername: "x",
            actorAvatarUrl: null,
            type: "follow",
            entityType: "user",
            entityId: "u2",
            message: null,
            isRead: false,
            createdAt: new Date().toISOString(),
          },
        ],
        pagination: { hasMore: true, nextCursor: "cursor-1" },
      })
      .mockResolvedValueOnce({
        success: true,
        notifications: [
          {
            id: "n2",
            userId: "u1",
            actorUserId: "u3",
            actorUsername: "y",
            actorAvatarUrl: null,
            type: "fitpic_like",
            entityType: "fitpic",
            entityId: "fp1",
            message: null,
            isRead: false,
            createdAt: new Date().toISOString(),
          },
        ],
        pagination: { hasMore: false },
      });

    const screen = render(<HookHarness />);
    await waitFor(() => {
      expect(screen.getByTestId("count").props.children).toBe("1");
    });

    fireEvent.press(screen.getByTestId("loadMore"));
    await waitFor(() => {
      expect(screen.getByTestId("count").props.children).toBe("2");
    });
    expect(mockedGetNotifications).toHaveBeenCalledTimes(2);
    expect(mockedGetNotifications).toHaveBeenLastCalledWith({
      limit: 20,
      cursor: "cursor-1",
    });
  });

  test("refresh replaces list", async () => {
    mockedGetNotifications
      .mockResolvedValueOnce({
        success: true,
        notifications: [
          {
            id: "n1",
            userId: "u1",
            actorUserId: "u2",
            actorUsername: "x",
            actorAvatarUrl: null,
            type: "follow",
            entityType: "user",
            entityId: "u2",
            message: null,
            isRead: false,
            createdAt: new Date().toISOString(),
          },
        ],
        pagination: { hasMore: false },
      })
      .mockResolvedValueOnce({
        success: true,
        notifications: [],
        pagination: { hasMore: false },
      });

    const screen = render(<HookHarness />);
    await waitFor(() => {
      expect(screen.getByTestId("count").props.children).toBe("1");
    });

    fireEvent.press(screen.getByTestId("refresh"));
    await waitFor(() => {
      expect(screen.getByTestId("count").props.children).toBe("0");
    });
  });
});
