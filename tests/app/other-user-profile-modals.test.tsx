import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { FlatList } from "react-native";

jest.mock("react-native-safe-area-context", () => {
  const ReactLocal = require("react");
  const { View } = require("react-native");
  return {
    SafeAreaView: ({ children }: { children?: React.ReactNode }) =>
      ReactLocal.createElement(View, null, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock("@expo/vector-icons", () => {
  const ReactLocal = require("react");
  const { View } = require("react-native");
  return {
    Ionicons: () => ReactLocal.createElement(View, null),
  };
});

jest.mock("../../components/common/UserAvatar", () => {
  const ReactLocal = require("react");
  const { TouchableOpacity, View } = require("react-native");
  return function MockUserAvatar({ onPress }: { onPress?: () => void }) {
    return ReactLocal.createElement(
      TouchableOpacity,
      { onPress, testID: "mock-avatar" },
      ReactLocal.createElement(View, null)
    );
  };
});

jest.mock("@/src/services/apiClients/userClient", () => ({
  userApiClient: {
    getFollowers: jest.fn(),
    getFollowing: jest.fn(),
    followUser: jest.fn(),
    unfollowUser: jest.fn(),
  },
}));

jest.mock("@/src/navigation/openUserProfile", () => ({
  openUserProfile: jest.fn(),
}));

import OtherUserFollowersModal from "@/components/other-user-profile/OtherUserFollowersModal";
import OtherUserFollowingModal from "@/components/other-user-profile/OtherUserFollowingModal";
import { userApiClient } from "@/src/services/apiClients/userClient";
import { openUserProfile } from "@/src/navigation/openUserProfile";

const mockGetFollowers = userApiClient.getFollowers as jest.Mock;
const mockGetFollowing = userApiClient.getFollowing as jest.Mock;
const mockFollowUser = userApiClient.followUser as jest.Mock;
const mockUnfollowUser = userApiClient.unfollowUser as jest.Mock;
const mockOpenUserProfile = openUserProfile as jest.Mock;

describe("OtherUserFollowersModal", () => {
  beforeEach(() => {
    mockGetFollowers.mockResolvedValue({
      followers: [
        {
          uid: "row-1",
          username: "alice",
          displayName: "Alice",
          isFollowing: false,
          isPrivateAccount: false,
        },
      ],
      pagination: { hasMore: false, nextCursor: null },
    });
    mockFollowUser.mockResolvedValue(undefined);
    mockUnfollowUser.mockResolvedValue(undefined);
  });

  test("loads followers when visible and shows third-person empty copy when list empty", async () => {
    mockGetFollowers.mockResolvedValueOnce({
      followers: [],
      pagination: { hasMore: false, nextCursor: null },
    });
    const screen = render(
      <OtherUserFollowersModal visible onClose={jest.fn()} userId="viewed-1" />
    );
    await waitFor(() => {
      expect(screen.getByText("No followers yet")).toBeTruthy();
    });
    expect(
      screen.getByText("When people follow this account, they'll appear here.")
    ).toBeTruthy();
    expect(mockGetFollowers).toHaveBeenCalledWith("viewed-1", { limit: 20, cursor: undefined });
  });

  test("calls openUserProfile then onClose when username pressed", async () => {
    const onClose = jest.fn();
    const screen = render(
      <OtherUserFollowersModal visible onClose={onClose} userId="viewed-1" />
    );
    await waitFor(() => expect(screen.getByText("@alice")).toBeTruthy());
    fireEvent.press(screen.getByText("@alice"));
    expect(mockOpenUserProfile).toHaveBeenCalledWith("row-1");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("invokes onFollowChange after successful follow toggle", async () => {
    const onFollowChange = jest.fn();
    const screen = render(
      <OtherUserFollowersModal
        visible
        onClose={jest.fn()}
        userId="viewed-1"
        onFollowChange={onFollowChange}
      />
    );
    await waitFor(() => expect(screen.getByText("Follow")).toBeTruthy());
    fireEvent.press(screen.getByText("Follow"));
    await waitFor(() => {
      expect(mockFollowUser).toHaveBeenCalledWith("row-1");
      expect(onFollowChange).toHaveBeenCalledTimes(1);
    });
  });

  test("appends next page when paginating", async () => {
    mockGetFollowers
      .mockResolvedValueOnce({
        followers: [{ uid: "a", username: "a", isFollowing: true, isPrivateAccount: false }],
        pagination: { hasMore: true, nextCursor: "c2" },
      })
      .mockResolvedValueOnce({
        followers: [{ uid: "b", username: "b", isFollowing: true, isPrivateAccount: false }],
        pagination: { hasMore: false, nextCursor: null },
      });

    const view = render(
      <OtherUserFollowersModal visible onClose={jest.fn()} userId="viewed-1" />
    );
    await waitFor(() => expect(view.getByText("@a")).toBeTruthy());

    const list = view.UNSAFE_root.findByType(FlatList);
    list.props.onEndReached?.();
    await waitFor(() => expect(view.getByText("@b")).toBeTruthy());
    expect(mockGetFollowers).toHaveBeenLastCalledWith("viewed-1", { limit: 20, cursor: "c2" });
  });
});

describe("OtherUserFollowingModal", () => {
  beforeEach(() => {
    mockGetFollowing.mockResolvedValue({
      following: [],
      pagination: { hasMore: false, nextCursor: null },
    });
  });

  test("shows third-person empty subtitle", async () => {
    const screen = render(
      <OtherUserFollowingModal visible onClose={jest.fn()} userId="viewed-1" />
    );
    await waitFor(() => {
      expect(screen.getByText("Not following anyone")).toBeTruthy();
    });
    expect(screen.getByText("Accounts they follow will appear here.")).toBeTruthy();
  });
});
