import React, { useState, useEffect, useCallback } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import MasonryGrid from "../masonry-grid";
import FitPic_Cover from "../home/fitpic-cover";
import Product_Cover, { PRODUCT_LABEL_HEIGHT } from "../home/product-cover";
import type { FeedItem } from "../../src/types/feed";
import { buildHomeFeed } from "../../src/utils/normalizeFeed";
import { contentApiClient } from "../../src/services/apiClients/contentClient";
import { fitpicClient } from "../../src/services/apiClients/fitpicClient";
import { consumeFeedRefetch } from "../../src/feedRefresh";
import { useForYouFeed } from "../../src/hooks/useForYouFeed";
import { useFollowingFeed } from "../../src/hooks/useFollowingFeed";
import { useBrowseFeed } from "../../src/hooks/useBrowseFeed";

const useRealApi = (): boolean =>
  process.env.EXPO_PUBLIC_API_MODE === "real";

function shuffle<T>(arr: T[]) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Props = {
  dataOverride?: FeedItem[];
  columns?: number;
  gutter?: number;
  contentPadding?: number;
  feedType?: "forYou" | "following" | "browse";
};

// Shared tile renderer extracted so both For You and legacy paths use identical markup.
function renderTile(item: FeedItem, colW: number, feedType: string) {
  const handlePress = () => {
    if (item.type === "fitpic") {
      router.push({ pathname: "/fitpic-detail", params: { id: item.id } });
    } else {
      router.push({
        pathname: "/product-detail",
        params: { id: item.id, source: `home_feed_${feedType}` },
      });
    }
  };

  if (item.type === "fitpic") {
    const aspectRatio =
      item.height && item.width ? item.height / item.width : 1;
    const scaledH = Math.round(colW * aspectRatio);
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
        <FitPic_Cover
          width={colW}
          height={scaledH}
          source={item.source}
          tagCount={item.featuredProducts?.total ?? 0}
          sharedTransitionTag={`fitpic-${item.id}`}
        />
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
      <Product_Cover
        width={colW}
        source={item.source}
        brand={item.brand}
        name={item.name}
        price={item.price}
        salePrice={item.salePrice}
        priceType={item.priceType}
        sharedTransitionTag={`product-${item.id}`}
      />
    </TouchableOpacity>
  );
}

function getItemHeight(item: FeedItem, colW: number): number {
  if (item.type === "fitpic") {
    const aspectRatio =
      item.height && item.width ? item.height / item.width : 1;
    return Math.round(colW * aspectRatio);
  }
  return colW + PRODUCT_LABEL_HEIGHT;
}

export default function Home_Grid({
  dataOverride,
  columns = 2,
  gutter = 8,
  contentPadding = 12,
  feedType = "forYou",
}: Props) {
  // For You state — always initialised; only drives UI when feedType === "forYou"
  // and no dataOverride is present.
  const forYouFeed = useForYouFeed();

  // Following state — always initialised; only drives UI when feedType === "following"
  // and no dataOverride is present.
  const followingFeed = useFollowingFeed();

  // Browse state — always initialised; only drives UI when feedType === "browse"
  // and no dataOverride is present.
  const browseFeed = useBrowseFeed();

  // Legacy state for dataOverride path.
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(!dataOverride);

  const isForYouMode = feedType === "forYou" && !dataOverride;
  const isFollowingMode = feedType === "following" && !dataOverride;
  const isBrowseMode = feedType === "browse" && !dataOverride;

  // ── For You / Following / Browse: initialise on mount and on feedType change ──
  useEffect(() => {
    if (isForYouMode) {
      forYouFeed.initialize();
    } else if (isFollowingMode) {
      followingFeed.initialize();
    } else if (isBrowseMode) {
      browseFeed.initialize();
    }
    // initialize callbacks are stable (useCallback with [])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isForYouMode, isFollowingMode, isBrowseMode]);

  // ── Legacy feeds: dataOverride ────────────────────────────────────────────
  useEffect(() => {
    if (isForYouMode || isFollowingMode || isBrowseMode) return; // handled by dedicated hooks above

    if (dataOverride) {
      setData(shuffle(dataOverride));
      setLoading(false);
      return;
    }

    const loadFeed = async () => {
      setLoading(true);
      try {
        const legacyFeedType = feedType as "forYou" | "following" | "trending";
        if (useRealApi()) {
          const [fitpicResult, feedResult] = await Promise.allSettled([
            fitpicClient.list(undefined, 50),
            contentApiClient.getFeed({ type: legacyFeedType, limit: 50 }),
          ]);
          const fitpics =
            fitpicResult.status === "fulfilled" &&
            fitpicResult.value?.success &&
            fitpicResult.value?.fitpics
              ? fitpicResult.value.fitpics
              : [];
          const products =
            feedResult.status === "fulfilled" && feedResult.value?.products
              ? feedResult.value.products
              : [];
          const feedData = await buildHomeFeed(fitpics, products);
          setData(shuffle(feedData));
        } else {
          const response = await contentApiClient.getFeed({
            type: legacyFeedType,
            limit: 50,
          });
          if (!response) {
            console.warn("getFeed returned undefined response");
            setData([]);
            return;
          }
          const feedData = await buildHomeFeed(response.fitpics, response.products);
          setData(shuffle(feedData));
        }
      } catch (error) {
        console.error("Error loading feed:", error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    loadFeed();
  }, [dataOverride, feedType, isForYouMode, isFollowingMode, isBrowseMode]);

  // ── Unified refresh (called by RefreshControl + useFocusEffect) ──────────
  const onRefresh = useCallback(async () => {
    if (isForYouMode) {
      // Refresh path: calls getForYou({ cursor: undefined }) — first page replace.
      return forYouFeed.refresh();
    }
    if (isFollowingMode) {
      return followingFeed.refresh();
    }
    if (isBrowseMode) {
      return browseFeed.refresh();
    }

    setRefreshing(true);
    try {
      const legacyFeedType = feedType as "forYou" | "following" | "trending";
      if (dataOverride) {
        setData(shuffle(dataOverride));
      } else if (useRealApi()) {
        const [fitpicResult, feedResult] = await Promise.allSettled([
          fitpicClient.list(undefined, 50),
          contentApiClient.getFeed({ type: legacyFeedType, limit: 50 }),
        ]);
        const fitpics =
          fitpicResult.status === "fulfilled" &&
          fitpicResult.value?.success &&
          fitpicResult.value?.fitpics
            ? fitpicResult.value.fitpics
            : [];
        const products =
          feedResult.status === "fulfilled" && feedResult.value?.products
            ? feedResult.value.products
            : [];
        const feedData = await buildHomeFeed(fitpics, products);
        setData(shuffle(feedData));
      } else {
        const response = await contentApiClient.getFeed({
          type: legacyFeedType,
          limit: 50,
        });
        if (!response) {
          console.warn("getFeed returned undefined response on refresh");
          return;
        }
        const feedData = await buildHomeFeed(response.fitpics, response.products);
        setData(shuffle(feedData));
      }
    } catch (error) {
      console.error("Error refreshing feed:", error);
    } finally {
      setRefreshing(false);
    }
  }, [dataOverride, feedType, isForYouMode, isFollowingMode, isBrowseMode, forYouFeed, followingFeed, browseFeed]);

  // Refetch after returning from create flow
  useFocusEffect(
    useCallback(() => {
      if (consumeFeedRefetch()) {
        onRefresh();
      }
    }, [onRefresh])
  );

  // ── For You render path ───────────────────────────────────────────────────
  if (isForYouMode) {
    const { status, items, error } = forYouFeed.state;

    if (status === "loading") {
      return (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#6B7280" />
        </View>
      );
    }

    if (status === "error") {
      return (
        <View style={styles.centeredContainer}>
          <Text style={styles.emptyText}>Something went wrong</Text>
          <TouchableOpacity
            onPress={forYouFeed.initialize}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (items.length === 0 && status === "idle") {
      return (
        <View style={styles.centeredContainer}>
          <Text style={styles.emptyText}>No posts yet</Text>
        </View>
      );
    }

    return (
      <MasonryGrid<FeedItem>
        data={items}
        columns={columns}
        gutter={gutter}
        contentPadding={contentPadding}
        refreshControl={
          <RefreshControl
            refreshing={status === "refreshing"}
            onRefresh={forYouFeed.refresh}
          />
        }
        onEndReached={forYouFeed.loadNextPage}
        ListFooterComponent={
          status === "loadingMore" ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color="#6B7280" />
            </View>
          ) : undefined
        }
        getItemHeight={getItemHeight}
        renderItem={(item, colW) => renderTile(item, colW, feedType)}
        keyExtractor={(item: FeedItem) => `${item.type}:${item.id}`}
      />
    );
  }

  // ── Following render path ─────────────────────────────────────────────────
  if (isFollowingMode) {
    const { status, items, error } = followingFeed.state;

    if (status === "loading") {
      return (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#6B7280" />
        </View>
      );
    }

    if (status === "error") {
      return (
        <View style={styles.centeredContainer}>
          <Text style={styles.emptyText}>Something went wrong</Text>
          <TouchableOpacity
            onPress={followingFeed.initialize}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (items.length === 0 && status === "idle") {
      return (
        <View style={styles.centeredContainer}>
          <Text style={styles.emptyText}>Follow users to see their posts here</Text>
        </View>
      );
    }

    return (
      <MasonryGrid<FeedItem>
        data={items}
        columns={columns}
        gutter={gutter}
        contentPadding={contentPadding}
        refreshControl={
          <RefreshControl
            refreshing={status === "refreshing"}
            onRefresh={followingFeed.refresh}
          />
        }
        onEndReached={followingFeed.loadNextPage}
        ListFooterComponent={
          status === "loadingMore" ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color="#6B7280" />
            </View>
          ) : undefined
        }
        getItemHeight={getItemHeight}
        renderItem={(item, colW) => renderTile(item, colW, feedType)}
        keyExtractor={(item: FeedItem) => `${item.type}:${item.id}`}
      />
    );
  }

  // ── Browse render path ────────────────────────────────────────────────────
  if (isBrowseMode) {
    const { status, items, error } = browseFeed.state;

    if (status === "loading") {
      return (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#6B7280" />
        </View>
      );
    }

    if (status === "error") {
      return (
        <View style={styles.centeredContainer}>
          <Text style={styles.emptyText}>Something went wrong</Text>
          <TouchableOpacity
            onPress={browseFeed.initialize}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (items.length === 0 && status === "idle") {
      return (
        <View style={styles.centeredContainer}>
          <Text style={styles.emptyText}>No products to browse yet</Text>
        </View>
      );
    }

    return (
      <MasonryGrid<FeedItem>
        data={items}
        columns={columns}
        gutter={gutter}
        contentPadding={contentPadding}
        refreshControl={
          <RefreshControl
            refreshing={status === "refreshing"}
            onRefresh={browseFeed.refresh}
          />
        }
        onEndReached={browseFeed.loadNextPage}
        ListFooterComponent={
          status === "loadingMore" ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color="#6B7280" />
            </View>
          ) : undefined
        }
        getItemHeight={getItemHeight}
        renderItem={(item, colW) => renderTile(item, colW, feedType)}
        keyExtractor={(item: FeedItem) => `${item.type}:${item.id}`}
      />
    );
  }

  // ── Legacy render path (dataOverride) ─────────────────────────────────────
  if (loading) {
    return null;
  }

  if (data.length === 0) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.emptyText}>No posts yet</Text>
      </View>
    );
  }

  return (
    <MasonryGrid<FeedItem>
      data={data}
      columns={columns}
      gutter={gutter}
      contentPadding={contentPadding}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      getItemHeight={getItemHeight}
      renderItem={(item, colW) => renderTile(item, colW, feedType)}
      keyExtractor={(item: FeedItem) => item.id}
    />
  );
}

const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  retryText: {
    fontSize: 15,
    color: "#374151",
    fontWeight: "600",
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
});
