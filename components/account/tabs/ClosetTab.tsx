import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import useAccountData from "../../../src/hooks/useAccountData";
import productsData from "../../../src/mocks/mock-products.json";
import { PRODUCT_ASSETS } from "../../../src/maps/images";
import ClosetProductCard from "../closet/ClosetProductCard";
import EndlessRackCarousel from "../closet/EndlessRackCarousel";
import RackStackTile from "../closet/RackStackTile";

type Props = {
  userId?: string;
};

type Product = {
  id: string;
  name: string;
  brand: string;
  price: number;
  imagePath: string;
};

type Rack = {
  id: string;
  name: string;
  productIds: string[];
};

type ClosetData = {
  base?: {
    productIds: string[];
  };
  racks?: Rack[];
};

// Get products by IDs (helper function outside component for stability)
const getProductsByIds = (productIds: string[]): Product[] => {
  if (!productIds || !Array.isArray(productIds)) return [];
  return productIds
    .map((id) => {
      const product = (productsData as any).products.find(
        (p: any) => p.id === id
      );
      return product || null;
    })
    .filter((p): p is Product => p !== null);
};

export default function ClosetTab({ userId }: Props) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const isFocused = useIsFocused();
  const { data, loading } = useAccountData(userId || '');

  // Safely access closet data (using type assertion since ProfileMe doesn't include closet yet)
  const closetData = useMemo(() => {
    const me = data.me as any;
    const closet = me?.closet as ClosetData | undefined;
    
    if (!closet) {
      return {
        baseProductIds: [] as string[],
        racks: [] as Rack[],
      };
    }

    const baseProductIds = closet.base?.productIds || [];
    const racks = closet.racks || [];

    return {
      baseProductIds,
      racks: racks.filter((rack: Rack) => rack && rack.id && rack.name),
    };
  }, [data.me]);

  // Get products for each section
  const allProducts = useMemo(
    () => getProductsByIds(closetData.baseProductIds),
    [closetData.baseProductIds]
  );

  const rackSections = useMemo(() => {
    return closetData.racks.map((rack: Rack) => ({
      id: rack.id,
      name: rack.name,
      products: getProductsByIds(rack.productIds || []),
    }));
  }, [closetData.racks]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading closet...</Text>
      </View>
    );
  }

  // Render a product section with focused carousel
  const renderProductSection = (
    title: string,
    products: Product[],
    key: string,
    opts?: { alwaysShow?: boolean }
  ) => {
    const alwaysShow = opts?.alwaysShow ?? false;
    if (!alwaysShow && (!products || products.length === 0)) {
      return null;
    }

    // Filter products that have valid image sources
    const productsWithImages = products.filter(
      (product) => PRODUCT_ASSETS[product.id]
    );

    if (!alwaysShow && productsWithImages.length === 0) {
      return null;
    }

    return (
      <View key={key} style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Pressable
              onPress={() => {}}
              accessibilityRole="button"
              accessibilityLabel="Expand rack"
              hitSlop={10}
              style={styles.expandButton}
            >
              <Ionicons name="expand-outline" size={20} color="#11181C" />
            </Pressable>
          </View>
        </View>
        <EndlessRackCarousel
          products={productsWithImages}
          renderItem={(product, width) => {
            const imageSource = PRODUCT_ASSETS[product.id];
            if (!imageSource) {
              return null;
            }
            return (
              <ClosetProductCard
                width={width}
                source={imageSource}
              />
            );
          }}
          placeholderText="Post FitPic’s to Add to Closet!"
          autoDriftEnabled={isFocused}
        />
      </View>
    );
  };

  const gridHorizontalPadding = 24;
  const gridColumnGap = 12;
  const tileWidth =
    (screenWidth - gridHorizontalPadding * 2 - gridColumnGap) / 2;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.contentContainer, { paddingBottom: 16 + insets.bottom }]}
    >
      {/* All Products Section */}
      {renderProductSection("All Products", allProducts, "all-products", {
        alwaysShow: true,
      })}

      {/* Rack Grid */}
      <View style={[styles.racksGrid, { paddingHorizontal: gridHorizontalPadding }]}>
        {rackSections.map((rack, idx) => {
          const items = rack.products
            .filter((p) => PRODUCT_ASSETS[p.id])
            .slice(0, 3)
            .map((p) => ({
              id: p.id,
              source: PRODUCT_ASSETS[p.id],
            }));

          const isLeftColumn = idx % 2 === 0;
          return (
            <View
              key={rack.id}
              style={[
                styles.rackTileWrap,
                {
                  width: tileWidth,
                  marginRight: isLeftColumn ? gridColumnGap : 0,
                },
              ]}
            >
              <RackStackTile
                title={rack.name}
                width={tileWidth}
                items={items}
                maxPreviewCount={3}
                onPressExpand={() => {}}
              />
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 16,
  },
  section: {
    marginBottom: 32,
    overflow: "visible",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingLeft: 24, // slight right shift vs other aligned content
    paddingRight: 12,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  expandButton: {
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#11181C",
  },
  loadingText: {
    fontSize: 14,
    color: "#666A70",
    textAlign: "center",
    marginTop: 24,
  },
  racksGrid: {
    paddingTop: 4,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  rackTileWrap: {
    marginBottom: 28,
  },
});

