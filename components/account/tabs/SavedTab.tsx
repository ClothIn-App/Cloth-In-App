import React, { useState, useEffect, useMemo } from "react";
import { View, Text, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import MasonryGrid from "../../masonry-grid";
import FitPic_Cover from "../../home/fitpic-cover";
import Product_Cover, { PRODUCT_LABEL_HEIGHT } from "../../home/product-cover";
import type { FeedItem } from "../../../src/types/feed";
import { getFeedItemById } from "../../../src/utils/getFeedItem";
import sessionData from "../../../src/mocks/mock-session.json";
import usersData from "../../../src/mocks/mock-users.json";

type Props = {
  userId?: string;
};

type FilterType = "all" | "fitpics" | "products";

export default function SavedTab({ userId }: Props) {
  const [savedItems, setSavedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");

  // Get the user ID (use provided userId or fall back to session)
  const currentUserId = userId || sessionData.currentUserId;
  const currentUser = useMemo(() => {
    return (usersData as Record<string, any>)[currentUserId];
  }, [currentUserId]);

  // Load saved items
  const loadSavedItems = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const saved = currentUser.saved || [];

      // Load all saved items (already in order - most recent first)
      const items: FeedItem[] = [];

      for (const savedItem of saved) {
        const item = await getFeedItemById(savedItem.id);
        if (item && item.type === savedItem.type) {
          items.push(item);
        }
      }

      setSavedItems(items);
    } catch (error) {
      console.error("Error loading saved items:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSavedItems();
  }, [currentUser]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSavedItems();
    setRefreshing(false);
  };

  // Filter items based on selected filter
  const filteredItems = useMemo(() => {
    if (filter === "all") {
      return savedItems;
    } else if (filter === "fitpics") {
      return savedItems.filter((item) => item.type === "fitpic");
    } else {
      return savedItems.filter((item) => item.type === "product");
    }
  }, [savedItems, filter]);

  // Show loading state
  if (loading && savedItems.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8, color: "#11181C" }}>Loading saved items...</Text>
      </View>
    );
  }

  // Show empty state
  if (savedItems.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 4, color: "#11181C" }}>
          No saved posts
        </Text>
        <Text style={{ color: "#666A70", textAlign: "center" }}>
          Save posts to view them here.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Filter Buttons */}
      <View style={{ paddingVertical: 8, paddingHorizontal: 12 }}>
        <View style={{ flexDirection: "row", gap: 16 }}>
          {(["all", "fitpics", "products"] as FilterType[]).map((filterType) => {
            const active = filter === filterType;
            const label =
              filterType === "all"
                ? "All"
                : filterType === "fitpics"
                ? "FitPics"
                : "Products";
            return (
              <TouchableOpacity
                key={filterType}
                onPress={() => setFilter(filterType)}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 4,
                  borderBottomWidth: active ? 2 : 0,
                  borderBottomColor: "#11181C",
                }}
              >
                <Text style={{ 
                  color: active ? "#11181C" : "#666A70", 
                  fontWeight: active ? "600" : "400",
                  fontSize: 14,
                }}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Show empty state for filtered view or render grid */}
      {filteredItems.length === 0 && savedItems.length > 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 4, color: "#11181C" }}>
            No saved {filter === "fitpics" ? "FitPics" : "products"}
          </Text>
          <Text style={{ color: "#666A70", textAlign: "center" }}>
            {filter === "fitpics"
              ? "Save FitPics to view them here."
              : "Save products to view them here."}
          </Text>
        </View>
      ) : filteredItems.length > 0 ? (
        <MasonryGrid<FeedItem>
          data={filteredItems}
          columns={2}
          gutter={8}
          contentPadding={12}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
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
                  sharedTransitionTag={`product-${item.id}`}
                />
              </TouchableOpacity>
            );
          }}
          keyExtractor={(item: FeedItem) => item.id}
        />
      ) : null}
    </View>
  );
}
