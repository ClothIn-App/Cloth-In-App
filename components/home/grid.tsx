// MasonryGrid.tsx
// React Native / TypeScript — Two-column masonry (waterfall) grid using 9 local JPGs.
// No navigation or interactivity. Cursor-compatible.
//
// ───────────────────────────────────────────────────────────────────────────────
// Implementation notes / reasoning (kept in comments for a single-file deliverable)
//
// GOAL
// • Two fixed-width columns.
// • Each image height is computed from its intrinsic aspect ratio:
//   displayHeight = columnWidth × (naturalHeight / naturalWidth)
// • Independent column stacking (true masonry), consistent vertical spacing.
//
// STEP-BY-STEP APPROACH (true masonry layout)
// 1) Prepare data: list the 9 local images (require() so Metro bundles them).
// 2) Intrinsic sizes: for each image, use Image.resolveAssetSource() to get natural width/height.
// 3) Compute display size: displayHeight = COLUMN_WIDTH × (naturalH / naturalW).
// 4) Waterfall placement: maintain two arrays (left, right) + running heights.
//    Place each next image into the column with the smaller cumulative height.
// 5) Render: a parent ScrollView containing a row with two column <View>s.
//    Each column renders its assigned images in order with a fixed marginBottom.
// 6) Spacing: use a fixed gutter between columns and a fixed vertical margin per item.
//
// TRADEOFFS: FlatList vs custom logic
// • FlatList with numColumns creates uniform rows (not true masonry).
// • Libraries (e.g., recycler-list/masonry) exist, but the request is “layout only”
//   with local assets, so a simple custom layout is straightforward and predictable.
// • For 9 images (small data), ScrollView + manual layout is simplest and smooth.
//
// EDGE CASES
// • Missing dimensions: if a local asset somehow lacks width/height, fallback to square.
// • Extreme aspect ratios: heights may be very large/small; still correct via formula.
// • Slow image load: local assets resolve instantly; layout uses intrinsic size upfront.
//
// OPTIMIZATION
// • Use useMemo to compute columns once per dimension changes.
// • Use React.memo for cells to avoid unnecessary re-renders.
// • Layout is stable because we compute sizes synchronously from local assets.
//
// HOW TO ADAPT
// • If your 9 filenames differ from '1.jpg'...'9.jpg', change the `LOCAL_IMAGES` requires
//   to match the actual filenames in assets/Mock-Images/.
// ───────────────────────────────────────────────────────────────────────────────

import React, { useMemo, memo } from "react";
import {
  Image,
  ImageSourcePropType,
  ImageResolvedAssetSource,
  Image as RNImage,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

// ───────────────────────────────────────────────────────────────────────────────
// CONFIG — fixed column width & spacing
const COLUMN_WIDTH = 180;       // fixed width per column (in dp)
const GUTTER = 12;              // horizontal space between columns
const ITEM_MARGIN_BOTTOM = 12;  // vertical space under each image
const SIDE_PADDING = 16;        // horizontal padding around the grid

// ───────────────────────────────────────────────────────────────────────────────
// DATA — exactly 9 local JPGs in assets/Mock-Images/
//
// NOTE: If your actual files have different names, update these requires accordingly.
const LOCAL_IMAGES: ImageSourcePropType[] = [
  require("../../assets/mock-images/abheet-singh-sachdeva-VYc45RkdeuA-unsplash.jpg"),
  require("../../assets/mock-images/evgeni-tcherkasski-GsSUlbzXIec-unsplash.jpg"),
  require("../../assets/mock-images/evgeni-tcherkasski-hegb9Y8dKos-unsplash.jpg"),
  require("../../assets/mock-images/joshua-kettle-q8DovYzpoR8-unsplash.jpg"),
  require("../../assets/mock-images/masood-aslami-sSw20FmZvX4-unsplash.jpg"),
  require("../../assets/mock-images/nikita-pishchugin-B0mydNIV-sI-unsplash.jpg"),
  require("../../assets/mock-images/quiet-studio-wEMXOQwjG58-unsplash.jpg"),
  require("../../assets/mock-images/samsung-memory-us-2ofwyNTTvL8-unsplash.jpg"),
];

// ───────────────────────────────────────────────────────────────────────────────
// TYPES
type MasonryItem = {
  key: string;
  source: ImageSourcePropType;
  naturalW: number;
  naturalH: number;
  displayW: number;
  displayH: number;
};

type Columns = {
  left: MasonryItem[];
  right: MasonryItem[];
};

// ───────────────────────────────────────────────────────────────────────────────
// HELPERS
function getResolvedSize(src: ImageSourcePropType): { w: number; h: number } {
  // For local assets, resolveAssetSource returns width/height synchronously.
  const resolved: ImageResolvedAssetSource | undefined = RNImage.resolveAssetSource(
    src as any
  );
  const w = Math.max(1, resolved?.width ?? 0);  // avoid divide-by-zero
  const h = Math.max(1, resolved?.height ?? 0);
  return { w, h };
}

function buildItems(sources: ImageSourcePropType[], columnWidth: number): MasonryItem[] {
  return sources.map((source, idx) => {
    const { w: naturalW, h: naturalH } = getResolvedSize(source);
    const ratio = naturalH / naturalW; // aspect ratio
    const displayW = columnWidth;
    const displayH = Math.round(displayW * ratio);

    return {
      key: `img-${idx}`,
      source,
      naturalW,
      naturalH,
      displayW,
      displayH,
    };
  });
}

function layoutIntoColumns(items: MasonryItem[]): Columns {
  const left: MasonryItem[] = [];
  const right: MasonryItem[] = [];
  let leftHeight = 0;
  let rightHeight = 0;

  for (const item of items) {
    // Use the *rendered* height plus margin to decide stacking.
    const itemTotal = item.displayH + ITEM_MARGIN_BOTTOM;

    if (leftHeight <= rightHeight) {
      left.push(item);
      leftHeight += itemTotal;
    } else {
      right.push(item);
      rightHeight += itemTotal;
    }
  }
  return { left, right };
}

// ───────────────────────────────────────────────────────────────────────────────
// PRESENTATIONAL — individual cell
const MasonryCell = memo(function MasonryCell({
  item,
  style,
}: {
  item: MasonryItem;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.cell, style]}>
      <Image
        source={item.source}
        style={{ width: item.displayW, height: item.displayH, borderRadius: 8, backgroundColor: "#eaeaea" }}
        resizeMode="cover" // we computed exact size; "cover" keeps it visually neat with rounded corners
        // For true "no crop", "cover" vs "contain": since we fixed exact width/height from aspect,
        // either works; the intrinsic bitmap will fit exactly into the box. (No stretching occurs.)
      />
    </View>
  );
});

// ───────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT

// ───────────────────────────────────────────────────────────────────────────────
// STYLES
const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: SIDE_PADDING,
    paddingTop: 16,
    paddingBottom: 32,
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
  },
  column: {
    width: COLUMN_WIDTH,
    flexDirection: "column",
    // Create the gutter by adding marginRight on the left column only,
    // and marginLeft on the right column only. We'll space them here by wrapping.
    // Instead, simpler: give the two columns a fixed gap using a spacer view.
    // We’ll just add marginRight to the left column via composition below:
    // But for clarity here, we’ll put both columns with a spacer in between:
    // → Instead, keep it simple: we’ll wrap columns in a row and inject a spacer view.
  },
  cell: {
    // vertical spacing applied inline so the last item doesn’t add extra bottom here
  },
});

// ───────────────────────────────────────────────────────────────────────────────
// LAYOUT TWEAK: Insert a spacer between columns by overriding styles.row render.
//
// We can’t declare components inside StyleSheet, so adjust above render:
// Replace styles.row children with: [<View style={[styles.column, { marginRight: GUTTER }]} ...], <View style={styles.column} ...].
//
// To keep the code single-file and simple, here’s a tiny patch: re-export a wrapped row.
// (Cursor will keep it intact.)
// ───────────────────────────────────────────────────────────────────────────────

// Patch the row render to add gutter between columns by monkey-patching MasonryGrid’s render.
// Since we can’t hook into the component after export in RN, we’ll redefine MasonryGrid with gutter.
// (The above export is fine for reading; we’ll immediately override it with guttered layout.)

// eslint-disable-next-line @typescript-eslint/no-redeclare
function MasonryGridWithGutter() {
  const items = useMemo(() => buildItems(LOCAL_IMAGES, COLUMN_WIDTH), []);
  const { left, right } = useMemo(() => layoutIntoColumns(items), [items]);

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.row}>
        <View style={[styles.column, { marginRight: GUTTER }]}>
          {left.map((item) => (
            <MasonryCell
              key={item.key}
              item={item}
              style={{ marginBottom: ITEM_MARGIN_BOTTOM }}
            />
          ))}
        </View>
        <View style={styles.column}>
          {right.map((item) => (
            <MasonryCell
              key={item.key}
              item={item}
              style={{ marginBottom: ITEM_MARGIN_BOTTOM }}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

// Export the guttered variant as the default
export default MasonryGridWithGutter;
