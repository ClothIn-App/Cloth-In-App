import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from "react-native";

export type FeedType = "forYou" | "following" | "browse";

const OPTIONS: { key: FeedType; label: string }[] = [
  { key: "forYou", label: "For You" },
  { key: "following", label: "Following" },
  { key: "browse", label: "Browse" },
];

const DEFAULT_HEADER_HEIGHT = 56;

type Props = {
  visible: boolean;
  onClose: () => void;
  value: FeedType;
  onSelect: (value: FeedType) => void;
  /** Offset in px from top of parent to bottom of header; overlay starts here. */
  headerBottomY?: number;
};

export default function FeedTypeDropdown({
  visible,
  onClose,
  value,
  onSelect,
  headerBottomY,
}: Props) {
  if (!visible) return null;

  const top = headerBottomY ?? DEFAULT_HEADER_HEIGHT;

  const handleSelect = (key: FeedType) => {
    onSelect(key);
    onClose();
  };

  return (
    <View
      style={[styles.overlay, { top }]}
      pointerEvents="box-none"
    >
      <View style={styles.menu}>
        {OPTIONS.map((opt, index) => (
          <React.Fragment key={opt.key}>
            {index > 0 && <View style={styles.divider} />}
            <TouchableOpacity
              style={styles.option}
              onPress={() => handleSelect(opt.key)}
              activeOpacity={0.7}
            >
              <Text style={styles.optionText}>{opt.label}</Text>
              {value === opt.key && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          </React.Fragment>
        ))}
      </View>
      <Pressable style={styles.backdrop} onPress={onClose} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  menu: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 60,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e5e5",
    borderTopWidth: StyleSheet.hairlineWidth,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  optionText: {
    fontSize: 16,
    color: "#000",
    fontWeight: "400",
  },
  checkmark: {
    fontSize: 16,
    color: "#000",
    fontWeight: "600",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E6E6E6",
    marginHorizontal: 16,
  },
  backdrop: {
    flex: 1,
  },
});
