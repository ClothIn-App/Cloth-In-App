import React from "react";
import { Pressable, Text, View } from "react-native";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

jest.mock("@react-navigation/native", () => ({
  useFocusEffect: jest.fn(),
}));

import { useOtherUserFitPics } from "@/src/hooks/useOtherUserFitPics";
import { fitpicClient } from "@/src/services/apiClients/fitpicClient";
import type { FitPic } from "@/src/types/fitpic";

jest.mock("@/src/services/apiClients/fitpicClient", () => ({
  fitpicClient: {
    listByUser: jest.fn(),
  },
}));

const mockListByUser = fitpicClient.listByUser as jest.Mock;

function makeFitPic(id: string): FitPic {
  return {
    id,
    authorId: "author-1",
    author: { uid: "author-1", username: "testuser" },
    photos: [
      {
        id: `${id}-p0`,
        url: "https://example.com/photo.jpg",
        index: 0,
        isCover: true,
        width: 400,
        height: 600,
      },
    ],
    caption: "",
    products: [],
    createdAt: new Date().toISOString(),
    engagement: { likes: 2, dislikes: 0, heart: 0, fire: 0 },
  };
}

function Harness({ userId }: { userId: string }) {
  const { fitpics, loading, refreshing, hasMore, error, refresh, loadMore } =
    useOtherUserFitPics(userId);

  return (
    <View>
      <Text testID="count">{String(fitpics.length)}</Text>
      <Text testID="loading">{String(loading)}</Text>
      <Text testID="refreshing">{String(refreshing)}</Text>
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

describe("useOtherUserFitPics", () => {
  beforeEach(() => {
    mockListByUser.mockReset();
  });

  test("loads first page on mount via listByUser(userId, undefined, 20)", async () => {
    mockListByUser.mockResolvedValueOnce({
      success: true,
      fitpics: [makeFitPic("fp-1")],
      pagination: { hasMore: false, nextCursor: undefined },
    });

    const screen = render(<Harness userId="user-a" />);

    await waitFor(() => {
      expect(screen.getByTestId("loading").props.children).toBe("false");
    });
    expect(mockListByUser).toHaveBeenCalledWith("user-a", undefined, 20);
    expect(screen.getByTestId("count").props.children).toBe("1");
    expect(screen.getByTestId("hasMore").props.children).toBe("false");
  });

  test("refresh replaces list and calls listByUser with undefined cursor", async () => {
    mockListByUser
      .mockResolvedValueOnce({
        success: true,
        fitpics: [makeFitPic("a")],
        pagination: { hasMore: true, nextCursor: "c1" },
      })
      .mockResolvedValueOnce({
        success: true,
        fitpics: [makeFitPic("b")],
        pagination: { hasMore: false, nextCursor: undefined },
      });

    const screen = render(<Harness userId="user-a" />);
    await waitFor(() => expect(screen.getByTestId("count").props.children).toBe("1"));

    fireEvent.press(screen.getByTestId("refresh"));
    await waitFor(() => expect(screen.getByTestId("count").props.children).toBe("1"));
    await waitFor(() => {
      expect(screen.getByTestId("refreshing").props.children).toBe("false");
    });

    expect(mockListByUser).toHaveBeenNthCalledWith(1, "user-a", undefined, 20);
    expect(mockListByUser).toHaveBeenNthCalledWith(2, "user-a", undefined, 20);
    expect(screen.getByTestId("count").props.children).toBe("1");
  });

  test("loadMore appends and passes cursor from first response", async () => {
    mockListByUser
      .mockResolvedValueOnce({
        success: true,
        fitpics: [makeFitPic("p1")],
        pagination: { hasMore: true, nextCursor: "c1" },
      })
      .mockResolvedValueOnce({
        success: true,
        fitpics: [makeFitPic("p2")],
        pagination: { hasMore: false, nextCursor: undefined },
      });

    const screen = render(<Harness userId="user-a" />);
    await waitFor(() => expect(screen.getByTestId("count").props.children).toBe("1"));

    fireEvent.press(screen.getByTestId("loadMore"));
    await waitFor(() => expect(screen.getByTestId("count").props.children).toBe("2"));

    expect(mockListByUser).toHaveBeenNthCalledWith(1, "user-a", undefined, 20);
    expect(mockListByUser).toHaveBeenNthCalledWith(2, "user-a", "c1", 20);
  });

  test("does not call listByUser for loadMore when hasMore is false", async () => {
    mockListByUser.mockResolvedValueOnce({
      success: true,
      fitpics: [makeFitPic("only")],
      pagination: { hasMore: false, nextCursor: undefined },
    });

    const screen = render(<Harness userId="user-a" />);
    await waitFor(() => expect(screen.getByTestId("loading").props.children).toBe("false"));

    fireEvent.press(screen.getByTestId("loadMore"));
    await waitFor(() => {
      expect(mockListByUser).toHaveBeenCalledTimes(1);
    });
  });

  test("empty userId skips fetch and leaves count at 0", async () => {
    const screen = render(<Harness userId="" />);
    await waitFor(() => {
      expect(screen.getByTestId("loading").props.children).toBe("false");
    });
    expect(mockListByUser).not.toHaveBeenCalled();
    expect(screen.getByTestId("count").props.children).toBe("0");
  });
});
