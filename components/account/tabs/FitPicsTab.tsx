import React, { useCallback, useMemo } from "react";
import { View, Text, RefreshControl, TouchableOpacity, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import MasonryGrid from "../../masonry-grid";
import FitPic_Cover from "../../home/fitpic-cover";
import { useUserFitPics } from "../../../src/hooks/useUserFitPics";
import { useCurrentUserId } from "../../../src/hooks/useCurrentUserId";
import type { FitPicItem } from "../../../src/types/feed";
import { FITPIC_ASSETS } from "../../../src/maps/images";

type Props = {
  userId?: string;
};

function FitPicsTabOwn({ userId }: { userId: string }) {
  const {
    fitpics,
    loading,
    refreshing,
    hasMore,
    error,
    refresh,
    loadMore,
  } = useUserFitPics(userId);

  const feedItems: FitPicItem[] = useMemo(() => {
    return fitpics.map((fitpic): FitPicItem => {
      const coverPhoto = fitpic.photos[0];
      const productCount = fitpic.products.length;
      const photoUrl = coverPhoto?.url ?? coverPhoto?.thumbnailUrl ?? "";
      const imageSource =
        FITPIC_ASSETS[fitpic.id] ??
        (photoUrl ? { uri: photoUrl } : require("../../../assets/images/icon.png"));

      return {
        id: fitpic.id,
        type: "fitpic",
        source: imageSource,
        caption: fitpic.caption,
        featuredProducts: {
          total: productCount,
          productIds: fitpic.products.map((p) => p.id),
        },
        likes: fitpic.engagement.likes,
        author: fitpic.author.username,
        reactions: {
          counts: {
            LIKE: fitpic.engagement.likes,
            THUMBS_UP: 0,
            FIRE: 0,
            DISLIKE: 0,
          },
        },
        createdAt: fitpic.createdAt,
        location: typeof fitpic.location === "string" ? fitpic.location : fitpic.location?.name,
        width: coverPhoto?.width,
        height: coverPhoto?.height,
      };
    });
  }, [fitpics]);

  const onRefresh = () => {
    refresh();
  };

  const handleEndReached = useCallback(() => {
    if (hasMore && !loading && !refreshing) {
      loadMore();
    }
  }, [hasMore, loading, refreshing, loadMore]);

  if (loading && fitpics.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8, color: "#11181C" }}>Loading FitPics...</Text>
      </View>
    );
  }

  if (error && fitpics.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 16 }}>
        <Text style={{ fontSize: 16, color: "#11181C", marginBottom: 8 }}>Error loading FitPics</Text>
        <Text style={{ color: "#666A70", textAlign: "center" }}>{error}</Text>
      </View>
    );
  }

  if (feedItems.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          margin: 12,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "#E3E3E7",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 4, color: "#11181C" }}>
          No FitPics yet
        </Text>
        <Text style={{ color: "#666A70", textAlign: "center" }}>
          Post your first fit to see it here.
        </Text>
      </View>
    );
  }

  const listFooter =
    loading && fitpics.length > 0 ? (
      <View style={{ paddingVertical: 16, alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    ) : null;

  return (
    <MasonryGrid<FitPicItem>
      data={feedItems}
      columns={2}
      gutter={8}
      contentPadding={12}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      onEndReached={handleEndReached}
      ListFooterComponent={listFooter}
      getItemHeight={(item: FitPicItem, colW: number) => {
        const aspectRatio = item.height && item.width ? item.height / item.width : 1;
        return Math.round(colW * aspectRatio);
      }}
      renderItem={(item: FitPicItem, colW: number) => {
        const handlePress = () => {
          router.push({
            pathname: "/fitpic-detail",
            params: { id: item.id },
          });
        };

        const aspectRatio = item.height && item.width ? item.height / item.width : 1;
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
      }}
      keyExtractor={(item: FitPicItem) => item.id}
    />
  );
}

export default function FitPicsTab({ userId }: Props) {
  const { userId: currentUserId, loading: authLoading } = useCurrentUserId();

  if (!userId) {
    return <FitPicsTabOwn userId="" />;
  }

  if (authLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (userId !== currentUserId) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <Text style={{ color: "#666A70", textAlign: "center" }}>
          Profile preview is unavailable.
        </Text>
      </View>
    );
  }

  return <FitPicsTabOwn userId={userId} />;
}
