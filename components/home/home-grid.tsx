import React, { useState, useEffect, useCallback } from "react";
import { RefreshControl, TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import MasonryGrid from "../masonry-grid";
import FitPic_Cover from "../home/fitpic-cover";
import Product_Cover, { PRODUCT_LABEL_HEIGHT } from "../home/product-cover";
import type { FeedItem } from "../../src/types/feed";
import { buildHomeFeed, buildProductFeed } from "../../src/utils/normalizeFeed";
import { contentApiClient } from "../../src/services/apiClients/contentClient";
import { fitpicClient } from "../../src/services/apiClients/fitpicClient";
import { consumeFeedRefetch } from "../../src/feedRefresh";

const useRealApi = (): boolean =>
  process.env.EXPO_PUBLIC_API_MODE === "real";

// add at top-level of file (outside component)
function shuffle<T>(arr: T[]) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Props = {
  dataOverride?: FeedItem[]; // optional: pass your own data (e.g., for testing)
  columns?: number;          // default 2
  gutter?: number;           // default 8
  contentPadding?: number;   // default 12
  feedType?: "forYou" | "following" | "browse"; // Feed type: For You, Following, or Browse (products only)
};

export default function Home_Grid({
  dataOverride,
  columns = 2,
  gutter = 8,
  contentPadding = 12,
  feedType = "forYou",
}: Props) {
  const baseData: FeedItem[] = dataOverride ?? [];
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(!dataOverride);

  useEffect(() => {
    if (dataOverride) {
      setData(shuffle(dataOverride));
      setLoading(false);
    } else {
      const loadFeed = async () => {
        setLoading(true);
        try {
          if (feedType === "browse") {
            const response = await contentApiClient.getProducts({ limit: 50 });
            if (!response?.products) {
              setData([]);
              return;
            }
            const productItems = await buildProductFeed(response.products);
            setData(shuffle(productItems));
          } else if (useRealApi()) {
            const [fitpicResult, feedResult] = await Promise.allSettled([
              fitpicClient.list(undefined, 50),
              contentApiClient.getFeed({ type: feedType, limit: 50 }),
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
              type: feedType,
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
    }
  }, [dataOverride, feedType]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (dataOverride) {
        setData(shuffle(dataOverride));
      } else if (feedType === "browse") {
        const response = await contentApiClient.getProducts({ limit: 50 });
        if (response?.products) {
          const productItems = await buildProductFeed(response.products);
          setData(shuffle(productItems));
        }
      } else if (useRealApi()) {
        const [fitpicResult, feedResult] = await Promise.allSettled([
          fitpicClient.list(undefined, 50),
          contentApiClient.getFeed({ type: feedType, limit: 50 }),
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
          type: feedType,
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
  }, [dataOverride, feedType]);

  // When returning from create flow (e.g. after posting), refetch feed if requested
  useFocusEffect(
    useCallback(() => {
      if (consumeFeedRefetch()) {
        onRefresh();
      }
    }, [onRefresh])
  );

  if (loading) {
    return null;
  }

  if (data.length === 0) {
    const emptyMessage =
      feedType === "browse"
        ? "No products to browse yet"
        : "No posts yet";
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
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
      // Height rules:
      // - FitPics: variable height by aspect ratio (full image shown)
      // - Products: always square image + fixed label block
      getItemHeight={(item: FeedItem, colW: number) => {
        if (item.type === "fitpic") {
          const aspectRatio =
            item.height && item.width ? item.height / item.width : 1;
          return Math.round(colW * aspectRatio);
        }
        // product
        return colW + PRODUCT_LABEL_HEIGHT;
      }}
      renderItem={(item: FeedItem, colW: number) => {
        const handlePress = () => {
          if (item.type === "fitpic") {
            router.push({
              pathname: "/fitpic-detail",
              params: { id: item.id },
            });
          } else {
            router.push({
              pathname: "/product-detail",
              params: { id: item.id },
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
        // product
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
      }}
      keyExtractor={(item: FeedItem) => item.id}
    />
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
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
});
