/**
 * Tests for useFollowingFeed hook.
 *
 * Covers:
 *  1. Empty state: backend returns empty items → status goes idle with empty list.
 *  2. Populated state: items are mapped and appear in state.
 *  3. Pagination: fetchMore sends the cursor from the previous response and
 *     appends results.
 *  4. Error state: backend failure puts hook in error state without crashing.
 */

import React from "react";
import { Pressable, Text, View } from "react-native";
import { render, fireEvent, waitFor } from "@testing-library/react-native";

// ── Mock the API client ────────────────────────────────────────────────────
jest.mock("@/src/services/apiClients/contentClient", () => ({
  contentApiClient: {
    getFollowingFeed: jest.fn(),
  },
}));

// ── Mock normalizeFeed so we avoid Image.resolveAssetSource in tests ───────
jest.mock("@/src/utils/normalizeFeed", () => ({
  buildFitPicFeed: jest.fn(),
}));

import { contentApiClient } from "@/src/services/apiClients/contentClient";
import { buildFitPicFeed } from "@/src/utils/normalizeFeed";
import { useFollowingFeed } from "@/src/hooks/useFollowingFeed";
import type { FeedItem } from "@/src/types/feed";

const mockedGetFollowingFeed = contentApiClient.getFollowingFeed as jest.Mock;
const mockedBuildFitPicFeed = buildFitPicFeed as jest.Mock;

// Minimal FeedItem stubs that satisfy the FitPicItem interface shape
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

// ── Hook harness ─────────────────────────────────────────────────────────
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
    mockedGetFollowingFeed.mockReset();
    mockedBuildFitPicFeed.mockReset();
  });

  // ── 1. Empty state ──────────────────────────────────────────────────────
  test("empty state: backend returns no items → idle with empty list", async () => {
    mockedGetFollowingFeed.mockResolvedValueOnce({
      items: [],
      nextCursor: null,
      hasMore: false,
    });
    mockedBuildFitPicFeed.mockResolvedValueOnce([]);

    const screen = render(<HookHarness />);

    fireEvent.press(screen.getByTestId("initialize"));

    await waitFor(() => {
      expect(screen.getByTestId("status").props.children).toBe("idle");
    });

    expect(screen.getByTestId("count").props.children).toBe("0");
    expect(screen.getByTestId("hasMore").props.children).toBe("false");
    expect(screen.getByTestId("error").props.children).toBe("");
  });

  // ── 2. Populated state ──────────────────────────────────────────────────
  test("populated state: items are mapped and appear in state", async () => {
    const mockItems = [makeFitPicItem("fp-1"), makeFitPicItem("fp-2")];

    mockedGetFollowingFeed.mockResolvedValueOnce({
      items: [{ id: "fp-1" }, { id: "fp-2" }], // raw server items (passed to buildFitPicFeed)
      nextCursor: null,
      hasMore: false,
    });
    mockedBuildFitPicFeed.mockResolvedValueOnce(mockItems);

    const screen = render(<HookHarness />);
    fireEvent.press(screen.getByTestId("initialize"));

    await waitFor(() => {
      expect(screen.getByTestId("count").props.children).toBe("2");
    });

    expect(screen.getByTestId("status").props.children).toBe("idle");
    expect(screen.getByTestId("hasMore").props.children).toBe("false");
  });

  // ── 3. Pagination ────────────────────────────────────────────────────────
  test("pagination: fetchMore sends cursor and appends results", async () => {
    const page1Items = [makeFitPicItem("fp-1")];
    const page2Items = [makeFitPicItem("fp-2")];

    mockedGetFollowingFeed
      .mockResolvedValueOnce({
        items: [{ id: "fp-1" }],
        nextCursor: "cursor-20",
        hasMore: true,
      })
      .mockResolvedValueOnce({
        items: [{ id: "fp-2" }],
        nextCursor: null,
        hasMore: false,
      });

    mockedBuildFitPicFeed
      .mockResolvedValueOnce(page1Items)
      .mockResolvedValueOnce(page2Items);

    const screen = render(<HookHarness />);

    // Load first page
    fireEvent.press(screen.getByTestId("initialize"));
    await waitFor(() => {
      expect(screen.getByTestId("count").props.children).toBe("1");
    });

    expect(screen.getByTestId("hasMore").props.children).toBe("true");

    // Load more (should send cursor)
    fireEvent.press(screen.getByTestId("loadMore"));
    await waitFor(() => {
      expect(screen.getByTestId("count").props.children).toBe("2");
    });

    expect(mockedGetFollowingFeed).toHaveBeenCalledTimes(2);
    // Second call must include the cursor from the first response
    expect(mockedGetFollowingFeed).toHaveBeenNthCalledWith(2, "cursor-20", 20);
    expect(screen.getByTestId("hasMore").props.children).toBe("false");
  });

  // ── 4. Error state ───────────────────────────────────────────────────────
  test("error state: backend failure surfaces error without crashing", async () => {
    mockedGetFollowingFeed.mockRejectedValueOnce(new Error("network failure"));

    const screen = render(<HookHarness />);
    fireEvent.press(screen.getByTestId("initialize"));

    await waitFor(() => {
      expect(screen.getByTestId("status").props.children).toBe("error");
    });

    expect(screen.getByTestId("error").props.children).toContain("network failure");
    expect(screen.getByTestId("count").props.children).toBe("0");
  });

  // ── Pull-to-refresh resets cursor ────────────────────────────────────────
  test("pull-to-refresh resets cursor and re-fetches from the top", async () => {
    const page1Items = [makeFitPicItem("fp-1")];
    const refreshItems = [makeFitPicItem("fp-A")];

    mockedGetFollowingFeed
      .mockResolvedValueOnce({
        items: [{ id: "fp-1" }],
        nextCursor: "cursor-20",
        hasMore: true,
      })
      .mockResolvedValueOnce({
        items: [{ id: "fp-A" }],
        nextCursor: null,
        hasMore: false,
      });

    mockedBuildFitPicFeed
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

    // Refresh must call without cursor (undefined)
    expect(mockedGetFollowingFeed).toHaveBeenCalledTimes(2);
    expect(mockedGetFollowingFeed).toHaveBeenNthCalledWith(2, undefined, 20);
  });
});
