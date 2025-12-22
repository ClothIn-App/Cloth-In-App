import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { router } from "expo-router";
import { FitPic } from "@/src/types/content";
import { FITPIC_ASSETS } from "@/src/maps/images";

const TILE_HEIGHT = 220;
const MIN_W = 90;
const MAX_W = 260;
const GAP = 12;

type ProductFitPicCarouselProps = {
  fitpics: FitPic[];
};

// Helper to compute tile width from image source
const getTileWidth = (imageSource: any): number => {
  // If it's a local bundled asset (require() returns a number)
  if (typeof imageSource === "number") {
    try {
      const resolved = Image.resolveAssetSource(imageSource);
      if (resolved && resolved.width && resolved.height) {
        const aspectRatio = resolved.width / resolved.height;
        const computedWidth = TILE_HEIGHT * aspectRatio;
        // Clamp between MIN_W and MAX_W
        return Math.max(MIN_W, Math.min(MAX_W, computedWidth));
      }
    } catch (error) {
      console.warn("Failed to resolve asset source:", error);
    }
  }
  
  // Fallback for remote URIs or errors: use default 1:1 aspect ratio
  return TILE_HEIGHT;
};

export function ProductFitPicCarousel({
  fitpics,
}: ProductFitPicCarouselProps) {
  const handleFitPicPress = (fitpicId: string) => {
    router.push({
      pathname: "/fitpic-detail",
      params: { id: fitpicId },
    });
  };

  const getImageSource = (fitpicId: string) => {
    return FITPIC_ASSETS[fitpicId] || { uri: "" };
  };

  if (!fitpics || fitpics.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Featured FitPics</Text>
        <Text style={styles.emptyText}>
          No FitPics featuring this product yet.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Featured FitPics</Text>
      <View style={styles.scrollWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {fitpics.map((fitpic, index) => {
            const imageSource = getImageSource(fitpic.id);
            const tileWidth = getTileWidth(imageSource);
            const isLast = index === fitpics.length - 1;
            return (
              <TouchableOpacity
                key={fitpic.id}
                onPress={() => handleFitPicPress(fitpic.id)}
                activeOpacity={0.8}
                style={[
                  styles.thumbnailContainer,
                  { width: tileWidth, height: TILE_HEIGHT },
                  isLast ? styles.lastThumbnail : { marginRight: GAP },
                ]}
              >
                <Image
                  source={imageSource}
                  style={styles.thumbnail}
                  resizeMode="cover"
                />
                <View style={styles.usernameOverlay}>
                  <Text style={styles.usernameText}>
                    @{fitpic.author}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
    paddingBottom: 20,
    paddingHorizontal: 20,
    marginTop: -22,
    backgroundColor: "white",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  scrollWrapper: {
    marginHorizontal: -14,
  },
  scrollContent: {
    paddingHorizontal: GAP,
  },
  thumbnailContainer: {
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f5f5f5",
    position: "relative",
  },
  lastThumbnail: {
    marginRight: 0,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  usernameOverlay: {
    position: "absolute",
    bottom: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  usernameText: {
    fontSize: 11,
    fontWeight: "500",
    color: "white",
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
});

