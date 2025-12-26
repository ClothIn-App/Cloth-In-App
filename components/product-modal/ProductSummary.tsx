import React from "react";
import { View, Text, Pressable, StyleSheet, Linking } from "react-native";

type ProductSummaryProps = {
  brandName: string;
  productName: string;
  price: number;
  productUrl?: string;
};

export function ProductSummary({
  brandName,
  productName,
  price,
  productUrl,
}: ProductSummaryProps) {
  const handleViewProduct = () => {
    if (productUrl) {
      Linking.openURL(productUrl);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>{brandName}</Text>
      <Text style={styles.name}>{productName}</Text>
      <Text style={styles.price}>${price.toFixed(2)}</Text>

      {productUrl && (
        <Pressable
          style={styles.button}
          onPress={handleViewProduct}
        >
          <Text style={styles.buttonText}>View Product</Text>
        </Pressable>
      )}
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
  price: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 20,
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


