import React, { useMemo } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useAccountData from "../../../src/hooks/useAccountData";
import productsData from "../../../src/mocks/mock-products.json";
import { PRODUCT_ASSETS } from "../../../src/maps/images";
import ClosetProductCard from "../closet/ClosetProductCard";
import EndlessRackCarousel from "../closet/EndlessRackCarousel";

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

  // Show empty state if no products
  const hasAnyProducts =
    allProducts.length > 0 ||
    rackSections.some((section: { products: Product[] }) => section.products.length > 0);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading closet...</Text>
      </View>
    );
  }

  if (!hasAnyProducts) {
    const border = '#E3E3E7';
    const muted = '#666A70';
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
          Closet is empty
        </Text>
        <Text style={{ color: muted, textAlign: "center" }}>
          Add items to your closet to manage them here.
        </Text>
      </View>
    );
  }

  // Render a product section with focused carousel
  const renderProductSection = (
    title: string,
    products: Product[],
    key: string
  ) => {
    if (!products || products.length === 0) {
      return null;
    }

    // Filter products that have valid image sources
    const productsWithImages = products.filter(
      (product) => PRODUCT_ASSETS[product.id]
    );

    if (productsWithImages.length === 0) {
      return null;
    }

    return (
      <View key={key} style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
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
        />
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.contentContainer, { paddingBottom: 16 + insets.bottom }]}
    >
      {/* All Products Section */}
      {renderProductSection("All Products", allProducts, "all-products")}

      {/* Rack Sections */}
      {rackSections.map((rack: { id: string; name: string; products: Product[] }) =>
        renderProductSection(rack.name, rack.products, rack.id)
      )}
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#11181C",
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#666A70",
    textAlign: "center",
    marginTop: 24,
  },
});

