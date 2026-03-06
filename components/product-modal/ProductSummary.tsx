import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import * as WebBrowser from "expo-web-browser";
import type { ProductPriceType } from "@/src/types/content";

type ProductSummaryProps = {
  brandName: string;
  productName: string;
  price: number;
  originalPrice?: number;
  priceType?: ProductPriceType;
  productUrl?: string;
};

export function ProductSummary({
  brandName,
  productName,
  price,
  originalPrice,
  priceType,
  productUrl,
}: ProductSummaryProps) {
  const handleViewProduct = async () => {
    let url: string;
    if (productUrl) {
      url = productUrl.includes("://") ? productUrl : `https://${productUrl}`;
    } else {
      const query = encodeURIComponent(`${brandName} ${productName}`);
      url = `https://www.google.com/search?q=${query}`;
    }
    await WebBrowser.openBrowserAsync(url);
  };

  const renderPrice = () => {
    if (priceType === "tbd") {
      return <Text style={styles.price}>Price TBD</Text>;
    }

    if (priceType === "na") {
      return null;
    }

    if (priceType === "sold_out") {
      return (
        <View style={styles.priceRow}>
          {price > 0 && (
            <Text style={styles.strikethroughPrice}>${price.toFixed(2)}</Text>
          )}
          <View style={styles.soldOutBadge}>
            <Text style={styles.soldOutText}>Sold Out</Text>
          </View>
        </View>
      );
    }

    if (priceType === "sale" && originalPrice && originalPrice > price) {
      return (
        <View style={styles.priceRow}>
          <Text style={styles.strikethroughPrice}>
            ${originalPrice.toFixed(2)}
          </Text>
          <Text style={styles.salePriceInline}>${price.toFixed(2)}</Text>
          <View style={styles.saleBadge}>
            <Text style={styles.saleText}>Sale</Text>
          </View>
        </View>
      );
    }

    return <Text style={styles.price}>${price.toFixed(2)}</Text>;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>{brandName}</Text>
      <Text style={styles.name}>{productName}</Text>
      {renderPrice()}

      <Pressable style={styles.button} onPress={handleViewProduct}>
        <Text style={styles.buttonText}>
          {productUrl ? "View Product" : "Search Product"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "white",
  },
  brand: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 12,
    flexWrap: "wrap",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  price: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 20,
  },
  salePriceInline: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
  },
  strikethroughPrice: {
    fontSize: 18,
    fontWeight: "500",
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  saleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "#FEE2E2",
    borderRadius: 6,
  },
  saleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#EF4444",
  },
  soldOutBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "#F3F4F6",
    borderRadius: 6,
  },
  soldOutText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  button: {
    width: "100%",
    backgroundColor: "#000000",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
