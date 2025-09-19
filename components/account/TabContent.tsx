import React, { useState } from "react";
import { View } from "react-native";
import { useThemeColor } from "../../hooks/useThemeColor";
import { ThemedText } from "../ThemedText";
import FitPicGrid from "../../src/components/FitPicGrid";
import FitPicDetailModal from "../../src/components/FitPicDetailModal";
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
  const border = useThemeColor({}, "border");
  const muted = useThemeColor({}, "mutedText");

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
        
        {/* FitPic Detail Modal */}
        <FitPicDetailModal
          fitpic={selectedFitPic}
          visible={!!selectedFitPic}
          onClose={() => setSelectedFitPic(null)}
          onLike={handleLike}
          onSave={handleSave}
        />
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
      <ThemedText style={{ fontSize: 16, fontWeight: "600", marginBottom: 4 }}>
        {msg.title}
      </ThemedText>
      {msg.subtitle ? (
        <ThemedText style={{ color: muted, textAlign: "center" }}>
          {msg.subtitle}
        </ThemedText>
      ) : null}
    </View>
  );
}
