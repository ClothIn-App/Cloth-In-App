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
import type { FitPic as ContentFitPic } from "@/src/types/content";
import type { FitPic as FitpicFitPic } from "@/src/types/fitpic";

// Support both FitPic types (content.ts has author as string, fitpic.ts has author as object)
type FitPic = ContentFitPic | FitpicFitPic;
import { FITPIC_ASSETS } from "@/src/maps/images";

const TILE_HEIGHT = 220;
const MIN_W = 90;
const MAX_W = 260;
const GAP = 12;

type ProductUserStyleCarouselProps = {
  fitpics: FitPic[];
  userName: string;
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

// Prefer API/DB dimensions when available (same as feed grid); otherwise use image source
const getTileWidthFromFitPic = (fitpic: FitPic, imageSource: any): number => {
  const photo = "photos" in fitpic ? fitpic.photos?.[0] : undefined;
  const w = photo?.width;
  const h = photo?.height;
  if (w != null && h != null && w > 0 && h > 0) {
    const aspectRatio = w / h;
    const computedWidth = TILE_HEIGHT * aspectRatio;
    return Math.max(MIN_W, Math.min(MAX_W, computedWidth));
  }
  return getTileWidth(imageSource);
};

export function ProductUserStyleCarousel({
  fitpics,
  userName,
}: ProductUserStyleCarouselProps) {
  const handleFitPicPress = (fitpicId: string) => {
    router.push({
      pathname: "/fitpic-detail",
      params: { id: fitpicId },
    });
  };

  const getImageSource = (fitpic: FitPic) => {
    if ("photos" in fitpic && fitpic.photos?.[0]) {
      const url = fitpic.photos[0].thumbnailUrl ?? fitpic.photos[0].url;
      if (url) return { uri: url };
    }
    if ("imagePath" in fitpic && fitpic.imagePath) {
      const path = fitpic.imagePath;
      if (
        typeof path === "string" &&
        (path.startsWith("http://") || path.startsWith("https://"))
      ) {
        return { uri: path };
      }
    }
    return FITPIC_ASSETS[fitpic.id] || { uri: "" };
  };

  if (!fitpics || fitpics.length === 0) {
    return null; // Don't render if no FitPics
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>@{userName}'s Style</Text>
      <View style={styles.scrollWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {fitpics.map((fitpic, index) => {
            const imageSource = getImageSource(fitpic);
            const tileWidth = getTileWidthFromFitPic(fitpic, imageSource);
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
                <TouchableOpacity
                  style={styles.usernameOverlay}
                  onPress={() => {
                    let userId: string | undefined;
                    if (typeof fitpic.author === 'object') {
                      userId = fitpic.author?.uid;
                    } else {
                      // For ContentFitPic type, author is a string (could be userId or username)
                      // For FitpicFitPic type, check authorId
                      userId = (fitpic as any).authorId || (fitpic.author?.startsWith('u_') ? fitpic.author : undefined);
                    }
                    if (userId) {
                      router.push({
                        pathname: '/user-profile',
                        params: { userId },
                      });
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.usernameText}>
                    @{typeof fitpic.author === 'string' ? fitpic.author : fitpic.author?.username || (fitpic as any).authorId || 'unknown'}
                  </Text>
                </TouchableOpacity>
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
    paddingBottom: 32,
    paddingHorizontal: 20,
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
});
