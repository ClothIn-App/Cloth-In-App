import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ActivityIndicator,
} from "react-native";
import { Image as ExpoImage, ImageSource } from "expo-image";

type ProductMediaProps = {
  images: string[];
};

const MOCK_IMAGE_MAP: Record<string, any> = {
  "c-d-x-PDX_a_82obo-unsplash.jpg": require("../../assets/mock-products/c-d-x-PDX_a_82obo-unsplash.jpg"),
  "daniel-korpai-hbTKIbuMmBI-unsplash.jpg": require("../../assets/mock-products/daniel-korpai-hbTKIbuMmBI-unsplash.jpg"),
  "domino-studio-164_6wVEHfI-unsplash.jpg": require("../../assets/mock-products/domino-studio-164_6wVEHfI-unsplash.jpg"),
  "fernando-andrade-potCPE_Cw8A-unsplash.jpg": require("../../assets/mock-products/fernando-andrade-potCPE_Cw8A-unsplash.jpg"),
  "giorgio-trovato-K62u25Jk6vo-unsplash.jpg": require("../../assets/mock-products/giorgio-trovato-K62u25Jk6vo-unsplash.jpg"),
  "joan-tran-reEySFadyJQ-unsplash.jpg": require("../../assets/mock-products/joan-tran-reEySFadyJQ-unsplash.jpg"),
  "mohammad-metri-E-0ON3VGrBc-unsplash.jpg": require("../../assets/mock-products/mohammad-metri-E-0ON3VGrBc-unsplash.jpg"),
  "rachit-tank-2cFZ_FB08UM-unsplash.jpg": require("../../assets/mock-products/rachit-tank-2cFZ_FB08UM-unsplash.jpg"),
};

const getImageSource = (imagePath: string): ImageSource | number | undefined => {
  if (!imagePath) return undefined;

  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return { uri: imagePath };
  }

  const filename = imagePath.split("/").pop() || imagePath;
  return MOCK_IMAGE_MAP[filename] || { uri: imagePath };
};

export function ProductMedia({ images }: ProductMediaProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingStates, setLoadingStates] = useState<Record<number, boolean>>({});
  const [errorStates, setErrorStates] = useState<Record<number, boolean>>({});
  const screenWidth = Dimensions.get("window").width;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / screenWidth);
    setCurrentIndex(newIndex);
  };

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        pagingEnabled
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
      >
        {images.map((imagePath, index) => {
          const source = getImageSource(imagePath);
          const isLoading = loadingStates[index];
          const hasError = errorStates[index];
          return (
            <View
              key={index}
              style={[
                styles.imageContainer,
                { width: screenWidth, height: screenWidth },
              ]}
            >
              {source && !hasError && (
                <ExpoImage
                  source={source}
                  style={styles.image}
                  contentFit="cover"
                  transition={300}
                  cachePolicy="memory-disk"
                  onLoadStart={() =>
                    setLoadingStates((s) => ({ ...s, [index]: true }))
                  }
                  onLoad={() =>
                    setLoadingStates((s) => ({ ...s, [index]: false }))
                  }
                  onError={() => {
                    setLoadingStates((s) => ({ ...s, [index]: false }));
                    setErrorStates((s) => ({ ...s, [index]: true }));
                  }}
                />
              )}
              {isLoading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#999" />
                </View>
              )}
              {hasError && (
                <View style={styles.errorPlaceholder}>
                  <Text style={styles.errorText}>Image unavailable</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {images.length > 1 && (
        <View style={styles.indicatorContainer}>
          <Text style={styles.indicatorText}>
            {currentIndex + 1} / {images.length}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: "white",
    position: "relative",
  },
  scrollView: {
    width: "100%",
  },
  imageContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  errorPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  errorText: {
    fontSize: 14,
    color: "#999",
  },
  indicatorContainer: {
    position: "absolute",
    bottom: 12,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  indicatorText: {
    fontSize: 12,
    color: "white",
    fontWeight: "600",
  },
});