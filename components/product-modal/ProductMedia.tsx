import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";

type ProductMediaProps = {
  images: string[];
};

// Helper function to convert image paths to require() statements
// Works with local mock filenames *and* future remote URLs.
const getImageSource = (imagePath: string) => {
  if (!imagePath) return undefined;

  // If this is already a remote URL from the API/DB, just use uri
  if (
    imagePath.startsWith("http://") ||
    imagePath.startsWith("https://")
  ) {
    return { uri: imagePath };
  }

  // Otherwise, treat it as a local mock path and map filename -> require()
  const filename = imagePath.split("/").pop() || imagePath;

  const imageMap: Record<string, any> = {
    "c-d-x-PDX_a_82obo-unsplash.jpg": require("../../assets/mock-products/c-d-x-PDX_a_82obo-unsplash.jpg"),
    "daniel-korpai-hbTKIbuMmBI-unsplash.jpg": require("../../assets/mock-products/daniel-korpai-hbTKIbuMmBI-unsplash.jpg"),
    "domino-studio-164_6wVEHfI-unsplash.jpg": require("../../assets/mock-products/domino-studio-164_6wVEHfI-unsplash.jpg"),
    "fernando-andrade-potCPE_Cw8A-unsplash.jpg": require("../../assets/mock-products/fernando-andrade-potCPE_Cw8A-unsplash.jpg"),
    "giorgio-trovato-K62u25Jk6vo-unsplash.jpg": require("../../assets/mock-products/giorgio-trovato-K62u25Jk6vo-unsplash.jpg"),
    "joan-tran-reEySFadyJQ-unsplash.jpg": require("../../assets/mock-products/joan-tran-reEySFadyJQ-unsplash.jpg"),
    "mohammad-metri-E-0ON3VGrBc-unsplash.jpg": require("../../assets/mock-products/mohammad-metri-E-0ON3VGrBc-unsplash.jpg"),
    "rachit-tank-2cFZ_FB08UM-unsplash.jpg": require("../../assets/mock-products/rachit-tank-2cFZ_FB08UM-unsplash.jpg"),
  };

  // If we know the filename as a local asset, use require; otherwise fallback to uri
  return imageMap[filename] || { uri: imagePath };
};

export function ProductMedia({ images }: ProductMediaProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
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
          return (
            <View
              key={index}
              style={[
                styles.imageContainer,
                { width: screenWidth, height: screenWidth },
              ]}
            >
              {source && (
                <Image
                  source={source}
                  style={styles.image}
                  resizeMode="cover"
                />
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Overlayed index indicator pill */}
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
    position: "relative", // needed for absolute overlay
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