import React, { useState } from "react";
import { View, Text } from "react-native";
import FitPicGrid from "../../src/components/FitPicGrid";
// FitPicDetailModal removed - will be reimplemented later
import { useUserFitPics } from "../../src/hooks/useUserFitPics";
import type { FitPic } from "../../src/types/fitpic";

type Props = { 
  activeKey: string;
  userId?: string;
};

const messages: Record<string, { title: string; subtitle?: string }> = {
  fitpics:  { title: "No FitPics yet",   subtitle: "Post your first fit to see it here." },
  closet:   { title: "Closet is empty",  subtitle: "Add items to your closet to manage them here." },
  products: { title: "No products",      subtitle: "Save products you love to see them here." },
  saved:    { title: "No saved posts",   subtitle: "Save posts to view them here." },
  tagged:   { title: "No tagged posts",  subtitle: "Posts you’re tagged in will show here." },
};

export default function TabContent({ activeKey, userId }: Props) {
  const [selectedFitPic, setSelectedFitPic] = useState<FitPic | null>(null);
  const msg = messages[activeKey] ?? { title: "Nothing here (yet)" };
  const border = '#E3E3E7';
  const muted = '#666A70';

  // Load user's FitPics for the fitpics tab
  const {
    fitpics,
    loading,
    refreshing,
    hasMore,
    error,
    refresh,
    loadMore,
    handleLike,
    handleSave,
  } = useUserFitPics(userId || '');

  // Render FitPics for the fitpics tab
  if (activeKey === 'fitpics' && userId) {
    return (
      <View style={{ flex: 1 }}>
        <FitPicGrid
          fitpics={fitpics}
          loading={loading}
          refreshing={refreshing}
          onRefresh={refresh}
          onLoadMore={loadMore}
          onFitPicPress={setSelectedFitPic}
          emptyMessage={msg.title}
          emptySubtitle={msg.subtitle}
          style={{ margin: 12 }}
        />
        
        {/* FitPic Detail Modal removed - will be reimplemented later */}
      </View>
    );
  }

  // Default empty state for other tabs
  return (
    <View
      style={{
        flex: 1,
        margin: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: border,
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 4, color: '#11181C' }}>
        {msg.title}
      </Text>
      {msg.subtitle ? (
        <Text style={{ color: muted, textAlign: "center" }}>
          {msg.subtitle}
        </Text>
      ) : null}
    </View>
  );
}
