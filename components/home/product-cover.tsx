import React from "react";
import { View, Text } from "react-native";
import ProgressiveImage from "../common/ProgressiveImage";

export const PRODUCT_LABEL_HEIGHT = 50;

type Props = {
  width: number;
  source: any;
  brand: string;
  name: string;
  price?: number | string | null;
  salePrice?: number | string | null;
  priceType?: 'fixed' | 'sale' | 'sold_out' | 'tbd' | 'na';
  outlined?: boolean;
  showLabel?: boolean;
  sharedTransitionTag?: string;
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
  priceType,
  outlined = true,
  showLabel = true,
  sharedTransitionTag,
}: Props) {
  const getBadgeContent = (): { text: string; bg: string } | null => {
    if (priceType === 'sold_out') {
      const p = formatPrice(price);
      return { text: p ? `${p} · Sold Out` : "Sold Out", bg: "rgba(107,114,128,0.85)" };
    }
    if (priceType === 'tbd') {
      return { text: "TBD", bg: "rgba(0,0,0,0.70)" };
    }
    const displayPrice = formatPrice(salePrice ?? price);
    if (!displayPrice) return null;
    return { text: displayPrice, bg: "rgba(0,0,0,0.70)" };
  };

  const badge = getBadgeContent();

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
        <ProgressiveImage 
          source={source} 
          style={{ width: "100%", height: "100%" }} 
          contentFit="cover"
        />

        {badge && (
          <View
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 8,
              backgroundColor: badge.bg,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>{badge.text}</Text>
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
