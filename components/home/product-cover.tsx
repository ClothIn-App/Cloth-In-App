import React from "react";
import { Image, View, Text } from "react-native";

export const PRODUCT_LABEL_HEIGHT = 50;

type Props = {
  width: number;
  source: any;                 // local require(...) or { uri }
  brand: string;
  name: string;
  price?: number | string | null;
  salePrice?: number | string | null;
  outlined?: boolean;          // show subtle border
  showLabel?: boolean;         // show brand/name box
};

const formatPrice = (v?: number | string | null) =>
  v == null || v === "" ? "" : (typeof v === "number" ? `$${v.toFixed(2)}` : String(v));

export default function Product_Cover({
  width,
  source,
  brand,
  name,
  price = null,
  salePrice = null,
  outlined = true,
  showLabel = true,
}: Props) {
  const priceText = formatPrice(salePrice ?? price);
  const showPrice = Boolean(priceText);

  return (
    <View
      style={{
        width,
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: "#fff",
        ...(outlined ? { borderWidth: 1, borderColor: "#E6E6E9" } : null),
      }}
    >
      {/* Image (square) */}
      <View style={{ width: "100%", height: width }}>
        <Image source={source} style={{ width: "100%", height: "100%" }} resizeMode="cover" />

        {/* Top-left price badge */}
        {showPrice && (
          <View
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 8,
              backgroundColor: "rgba(0,0,0,0.70)",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>{priceText}</Text>
          </View>
        )}
      </View>

      {/* Label box: brand (bold) on first line, product name below */}
      {showLabel && (
        <View
          style={{
            height: PRODUCT_LABEL_HEIGHT,
            backgroundColor: "#fff",
            justifyContent: "center",
            paddingHorizontal: 10,
          }}
        >
          <Text numberOfLines={1} style={{ fontWeight: "700", fontSize: 14 }}>
            {brand}
          </Text>
          <Text numberOfLines={1} style={{ color: "#5A5A5F", fontSize: 13 }}>
            {name}
          </Text>
        </View>
      )}
    </View>
  );
}
