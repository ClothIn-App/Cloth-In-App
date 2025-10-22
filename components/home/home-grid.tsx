import React from "react";
import MasonryGrid from "./MasonryGrid"; // the generic 2-col grid you already have
import FitPic_Cover from "./fitpic-cover";
import Product_Cover, { PRODUCT_LABEL_HEIGHT } from "@/components/covers/Product_Cover";
import type { FeedItem } from "@/types/feed";

type Props = {
  data: FeedItem[];
  gutter?: number;
  contentPadding?: number;
  columns?: number; // default 2
};

// helper for fitpic height from intrinsic
const fitpicHeight = (columnWidth: number, w?: number, h?: number) => {
  if (!w || !h) return columnWidth; // safe square placeholder if missing
  return Math.round(columnWidth * (h / w));
};

export default function Home_Grid({
  data,
  gutter = 8,
  contentPadding = 12,
  columns = 2,
}: Props) {
  return (
    <MasonryGrid
      data={data}
      columns={columns}
      gutter={gutter}
      contentPadding={contentPadding}
      /**
       * Provide (tileHeight, render) to the generic grid so it can lay out
       * properly before/while images load.
       */
      getItemHeight={(item, columnWidth) => {
        if (item.type === "fitpic") {
          return fitpicHeight(columnWidth, item.width, item.height);
        }
        // product: square image + fixed label box
        return columnWidth + PRODUCT_LABEL_HEIGHT;
      }}
      renderItem={(item, columnWidth) => {
        if (item.type === "fitpic") {
          const h = fitpicHeight(columnWidth, item.width, item.height);
          return <FitPic_Cover width={columnWidth} height={h} uri={item.uri} />;
        }
        return (
          <Product_Cover
            width={columnWidth}
            uri={item.uri}
            brand={item.brand}
            name={item.name}
          />
        );
      }}
      keyExtractor={(item: FeedItem) => item.id}
    />
  );
}
