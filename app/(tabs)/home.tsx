// app/tabs/index.tsx
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import SegmentedTabs from "../../components/SegmentedTabs";
import MasonryGrid from "../../src/components/MasonryGrid";
import FitPicDetailModal from "../../src/components/FitPicDetailModal";
import ProductDetailModal from "../../src/components/ProductDetailModal";
import StreakModal from "../../components/StreakModal";
import { useMixedFeed } from "../../src/hooks/useMixedFeed";
import type { FitPic } from "../../src/types/fitpic";
import type { ProductSearchResult } from "../../src/types/search";

export default function HomeScreen() {
  const [tab, setTab] = useState<"forYou" | "following">("forYou");
  const [selectedFitPic, setSelectedFitPic] = useState<FitPic | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductSearchResult | null>(null);
  const [streakModalVisible, setStreakModalVisible] = useState(false);
  
  const {
    fitpics,
    products,
    loading,
    refreshing,
    hasMore,
    error,
    refresh,
    loadMore,
    handleLike,
    handleSave,
  } = useMixedFeed(tab);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top"]}>
      <StatusBar style="dark" />

      {/* Custom Header with ClothIn title, streak, and search */}
      <View style={styles.headerContainer}>
        <Text style={styles.appTitle}>ClothIn</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            onPress={() => setStreakModalVisible(true)} 
            style={styles.streakButton}
          >
            <Ionicons name="flame" size={24} color="#FF6B35" />
            <Text style={styles.streakNumber}>7</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => router.push('/search-modal')} 
            style={styles.searchButton}
          >
            <Ionicons name="search-outline" size={24} color="#11181C" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <SegmentedTabs
          value={tab}
          onChange={setTab}
          options={[
            { key: "forYou", label: "For You" },
            { key: "following", label: "Following" },
          ]}
        />
      </View>
      <MasonryGrid
        fitpics={fitpics}
        products={products}
        loading={loading}
        refreshing={refreshing}
        onRefresh={refresh}
        onLoadMore={loadMore}
        onFitPicPress={setSelectedFitPic}
        onProductPress={setSelectedProduct}
        emptyMessage="No content yet"
        emptySubtitle="Discover amazing styles and products from the community!"
      />
      
      {/* FitPic Detail Modal */}
      <FitPicDetailModal
        fitpic={selectedFitPic}
        visible={!!selectedFitPic}
        onClose={() => setSelectedFitPic(null)}
        onLike={(fitpic) => handleLike(fitpic.id)}
        onSave={(fitpic) => handleSave(fitpic.id)}
        onProductPress={setSelectedProduct}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        visible={!!selectedProduct}
        onClose={() => {
          console.log('Home - closing product modal');
          setSelectedProduct(null);
        }}
        onFitPicPress={(fitpic) => {
          console.log('Home - fitpic pressed from product modal:', fitpic.id);
          setSelectedFitPic(fitpic);
        }}
      />

      {/* Streak Modal */}
      <StreakModal
        visible={streakModalVisible}
        onClose={() => setStreakModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e5e5',
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#11181C',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 4,
  },
  streakNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
  },
  searchButton: {
    padding: 8,
  },
});
