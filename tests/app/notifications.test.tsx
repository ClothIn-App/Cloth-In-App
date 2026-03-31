import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock("react-native-safe-area-context", () => {
  const ReactLocal = require("react");
  const { View } = require("react-native");
  return {
    SafeAreaView: ({ children }: any) => ReactLocal.createElement(View, null, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

jest.mock("@expo/vector-icons", () => {
  const ReactLocal = require("react");
  const { View } = require("react-native");
  return {
    Ionicons: () => ReactLocal.createElement(View, null),
  };
});

jest.mock("@/src/hooks/useNotifications", () => ({
  useNotifications: jest.fn(),
}));

jest.mock("@/src/services/apiClients/notificationsClient", () => ({
  notificationsApiClient: {
    markAllNotificationsRead: jest.fn().mockResolvedValue({ success: true, updated: 1 }),
  },
}));

jest.mock("@/src/navigation/openUserProfile", () => ({
  openUserProfile: jest.fn(),
}));

import NotificationsScreen from "@/app/notifications";
import { openUserProfile } from "@/src/navigation/openUserProfile";
import { notificationsApiClient } from "@/src/services/apiClients/notificationsClient";
import { useNotifications } from "@/src/hooks/useNotifications";

const mockedUseNotifications = useNotifications as jest.Mock;
const mockedMarkAllRead = notificationsApiClient.markAllNotificationsRead as jest.Mock;
const mockedOpenUserProfile = openUserProfile as jest.Mock;

function baseHookState(overrides?: Record<string, unknown>) {
  return {
    notifications: [],
    loading: false,
    refreshing: false,
    loadingMore: false,
    error: null,
    hasMore: false,
    refresh: jest.fn(),
    loadMore: jest.fn(),
    retry: jest.fn(),
    ...overrides,
  };
}

describe("NotificationsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedMarkAllRead.mockResolvedValue({ success: true, updated: 1 });
  });

  test("shows loading state", () => {
    mockedUseNotifications.mockReturnValue(baseHookState({ loading: true }));
    const screen = render(<NotificationsScreen />);
    expect(screen.getByTestId("notifications-loading")).toBeTruthy();
  });

  test("shows empty state", () => {
    mockedUseNotifications.mockReturnValue(baseHookState({ notifications: [] }));
    const screen = render(<NotificationsScreen />);
    expect(screen.getByTestId("notifications-empty")).toBeTruthy();
    expect(screen.getByText("No notifications yet")).toBeTruthy();
  });

  test("shows error state and retry action", () => {
    const retry = jest.fn();
    mockedUseNotifications.mockReturnValue(
      baseHookState({
        error: "network error",
        retry,
      })
    );
    const screen = render(<NotificationsScreen />);
    expect(screen.getByTestId("notifications-error")).toBeTruthy();
    fireEvent.press(screen.getByText("Try again"));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  test("calls loadMore on end reached when hasMore", () => {
    const loadMore = jest.fn();
    mockedUseNotifications.mockReturnValue(
      baseHookState({
        notifications: [
          {
            id: "n1",
            userId: "u1",
            actorUserId: "u2",
            actorUsername: "actor",
            actorAvatarUrl: null,
            type: "follow",
            entityType: "user",
            entityId: "u2",
            message: null,
            isRead: false,
            createdAt: new Date().toISOString(),
          },
        ],
        hasMore: true,
        loadMore,
      })
    );
    const screen = render(<NotificationsScreen />);
    fireEvent(screen.getByTestId("notifications-list"), "onEndReached");
    expect(loadMore).toHaveBeenCalledTimes(1);
  });

  test("maps follow row press to openUserProfile stub", () => {
    mockedUseNotifications.mockReturnValue(
      baseHookState({
        notifications: [
          {
            id: "n-follow",
            userId: "u1",
            actorUserId: "u-actor",
            actorUsername: "actor",
            actorAvatarUrl: null,
            type: "follow",
            entityType: "user",
            entityId: "u-actor",
            message: null,
            isRead: false,
            createdAt: new Date().toISOString(),
          },
        ],
      })
    );
    const screen = render(<NotificationsScreen />);
    fireEvent.press(screen.getByTestId("notification-row-n-follow"));
    expect(mockedOpenUserProfile).toHaveBeenCalledWith("u-actor");
    expect(mockPush).not.toHaveBeenCalled();
  });

  test("maps fitpic row press to fitpic detail", () => {
    mockedUseNotifications.mockReturnValue(
      baseHookState({
        notifications: [
          {
            id: "n-fitpic",
            userId: "u1",
            actorUserId: "u-actor",
            actorUsername: "actor",
            actorAvatarUrl: null,
            type: "fitpic_comment",
            entityType: "fitpic",
            entityId: "fp-123",
            message: null,
            isRead: false,
            createdAt: new Date().toISOString(),
          },
        ],
      })
    );
    const screen = render(<NotificationsScreen />);
    fireEvent.press(screen.getByTestId("notification-row-n-fitpic"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/fitpic-detail",
      params: { id: "fp-123" },
    });
  });

  test("marks all read when list has unread items", async () => {
    const refresh = jest.fn().mockResolvedValue(undefined);
    mockedUseNotifications.mockReturnValue(
      baseHookState({
        refresh,
        notifications: [
          {
            id: "n1",
            userId: "u1",
            actorUserId: "u2",
            actorUsername: "actor",
            actorAvatarUrl: null,
            type: "follow",
            entityType: "user",
            entityId: "u2",
            message: null,
            isRead: false,
            createdAt: new Date().toISOString(),
          },
        ],
      })
    );
    render(<NotificationsScreen />);
    await waitFor(() => {
      expect(mockedMarkAllRead).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(refresh).toHaveBeenCalled();
    });
  });

  test("maps product row press to product detail", () => {
    mockedUseNotifications.mockReturnValue(
      baseHookState({
        notifications: [
          {
            id: "n-product",
            userId: "u1",
            actorUserId: "u-actor",
            actorUsername: "actor",
            actorAvatarUrl: null,
            type: "product_like",
            entityType: "product",
            entityId: "p-123",
            message: null,
            isRead: false,
            createdAt: new Date().toISOString(),
          },
        ],
      })
    );
    const screen = render(<NotificationsScreen />);
    fireEvent.press(screen.getByTestId("notification-row-n-product"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/product-detail",
      params: { id: "p-123", source: "notifications" },
    });
  });
});
