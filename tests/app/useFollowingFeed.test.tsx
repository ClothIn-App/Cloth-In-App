/**
 * Tests for useFollowingFeed hook.
 */

import React from "react";
import { Pressable, Text, View } from "react-native";
import { render, fireEvent, waitFor } from "@testing-library/react-native";

jest.mock("@/src/services/apiClients/contentClient", () => ({
  contentApiClient: {
    getFollowing: jest.fn(),
  },
}));

jest.mock("@/src/utils/normalizeFeed", () => ({
  buildFollowingFeed: jest.fn(),
}));

import { contentApiClient } from "@/src/services/apiClients/contentClient";
import { buildFollowingFeed } from "@/src/utils/normalizeFeed";
import { useFollowingFeed } from "@/src/hooks/useFollowingFeed";
import type { FeedItem } from "@/src/types/feed";

const mockedGetFollowing = contentApiClient.getFollowing as jest.Mock;
const mockedBuildFollowingFeed = buildFollowingFeed as jest.Mock;

function makeFitPicItem(id: string): FeedItem {
  return {
    id,
    type: "fitpic",
    source: { uri: `https://example.com/${id}.jpg` },
    caption: "caption",
    featuredProducts: { total: 0, productIds: [] },
    likes: 0,
    author: "user1",
    reactions: { counts: { LIKE: 0, THUMBS_UP: 0, FIRE: 0, DISLIKE: 0 } },
    createdAt: new Date().toISOString(),
  };
}

function HookHarness() {
  const { state, initialize, refresh, loadNextPage } = useFollowingFeed();

  return (
    <View>
      <Text testID="status">{state.status}</Text>
      <Text testID="count">{String(state.items.length)}</Text>
      <Text testID="hasMore">{String(state.hasMore)}</Text>
      <Text testID="error">{state.error?.message ?? ""}</Text>
      <Pressable testID="initialize" onPress={initialize}>
        <Text>initialize</Text>
      </Pressable>
      <Pressable testID="refresh" onPress={refresh}>
        <Text>refresh</Text>
      </Pressable>
      <Pressable testID="loadMore" onPress={loadNextPage}>
        <Text>loadMore</Text>
      </Pressable>
    </View>
  );
}

describe("useFollowingFeed", () => {
  beforeEach(() => {
    mockedGetFollowing.mockReset();
    mockedBuildFollowingFeed.mockReset();
  });

  test("empty state: backend returns no items → idle with empty list", async () => {
    mockedGetFollowing.mockResolvedValueOnce({
      items: [],
      pagination: null,
    });
    mockedBuildFollowingFeed.mockResolvedValueOnce([]);

    const screen = render(<HookHarness />);

    fireEvent.press(screen.getByTestId("initialize"));

    await waitFor(() => {
      expect(screen.getByTestId("status").props.children).toBe("idle");
    });

    expect(screen.getByTestId("count").props.children).toBe("0");
    expect(screen.getByTestId("hasMore").props.children).toBe("false");
    expect(screen.getByTestId("error").props.children).toBe("");
  });

  test("populated state: items are mapped and appear in state", async () => {
    const mockItems = [makeFitPicItem("fp-1"), makeFitPicItem("fp-2")];

    mockedGetFollowing.mockResolvedValueOnce({
      items: [{ type: "fitpic", fitpic: { id: "fp-1" } }, { type: "fitpic", fitpic: { id: "fp-2" } }],
      pagination: null,
    });
    mockedBuildFollowingFeed.mockResolvedValueOnce(mockItems);

    const screen = render(<HookHarness />);
    fireEvent.press(screen.getByTestId("initialize"));

    await waitFor(() => {
      expect(screen.getByTestId("count").props.children).toBe("2");
    });

    expect(screen.getByTestId("status").props.children).toBe("idle");
    expect(screen.getByTestId("hasMore").props.children).toBe("false");
  });

  test("pagination: fetchMore sends cursor and appends results", async () => {
    const page1Items = [makeFitPicItem("fp-1")];
    const page2Items = [makeFitPicItem("fp-2")];

    mockedGetFollowing
      .mockResolvedValueOnce({
        items: [{ type: "fitpic", fitpic: { id: "fp-1" } }],
        pagination: { hasMore: true, nextCursor: "cursor-20" },
      })
      .mockResolvedValueOnce({
        items: [{ type: "fitpic", fitpic: { id: "fp-2" } }],
        pagination: { hasMore: false, nextCursor: undefined },
      });

    mockedBuildFollowingFeed
      .mockResolvedValueOnce(page1Items)
      .mockResolvedValueOnce(page2Items);

    const screen = render(<HookHarness />);

    fireEvent.press(screen.getByTestId("initialize"));
    await waitFor(() => {
      expect(screen.getByTestId("count").props.children).toBe("1");
    });

    expect(screen.getByTestId("hasMore").props.children).toBe("true");

    fireEvent.press(screen.getByTestId("loadMore"));
    await waitFor(() => {
      expect(screen.getByTestId("count").props.children).toBe("2");
    });

    expect(mockedGetFollowing).toHaveBeenCalledTimes(2);
    expect(mockedGetFollowing).toHaveBeenNthCalledWith(2, {
      limit: 20,
      cursor: "cursor-20",
    });
    expect(screen.getByTestId("hasMore").props.children).toBe("false");
  });

  test("error state: backend failure surfaces error without crashing", async () => {
    mockedGetFollowing.mockRejectedValueOnce(new Error("network failure"));

    const screen = render(<HookHarness />);
    fireEvent.press(screen.getByTestId("initialize"));

    await waitFor(() => {
      expect(screen.getByTestId("status").props.children).toBe("error");
    });

    expect(screen.getByTestId("error").props.children).toContain("network failure");
    expect(screen.getByTestId("count").props.children).toBe("0");
  });

  test("pull-to-refresh resets cursor and re-fetches from the top", async () => {
    const page1Items = [makeFitPicItem("fp-1")];
    const refreshItems = [makeFitPicItem("fp-A")];

    mockedGetFollowing
      .mockResolvedValueOnce({
        items: [{ type: "fitpic", fitpic: { id: "fp-1" } }],
        pagination: { hasMore: true, nextCursor: "cursor-20" },
      })
      .mockResolvedValueOnce({
        items: [{ type: "fitpic", fitpic: { id: "fp-A" } }],
        pagination: null,
      });

    mockedBuildFollowingFeed
      .mockResolvedValueOnce(page1Items)
      .mockResolvedValueOnce(refreshItems);

    const screen = render(<HookHarness />);
    fireEvent.press(screen.getByTestId("initialize"));
    await waitFor(() => {
      expect(screen.getByTestId("count").props.children).toBe("1");
    });

    fireEvent.press(screen.getByTestId("refresh"));
    await waitFor(() => {
      expect(screen.getByTestId("count").props.children).toBe("1");
    });

    expect(mockedGetFollowing).toHaveBeenCalledTimes(2);
    expect(mockedGetFollowing).toHaveBeenNthCalledWith(2, { limit: 20 });
  });
});
