import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type ProductHeaderProps = {
  brandName: string;
  productName: string;
  onClose: () => void;
  onAddToWishlist: () => void;
};

export function ProductHeader({
  brandName,
  productName,
  onClose,
  onAddToWishlist,
}: ProductHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const handleToggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleCloseMenu = () => {
    setIsMenuOpen(false);
  };

  const handleAddToWishlist = () => {
    setIsWishlisted(!isWishlisted);
    onAddToWishlist();
    setIsMenuOpen(false);
  };

  const handleShare = () => {
    console.log("Share Product pressed");
    setIsMenuOpen(false);
  };

  const handleReport = () => {
    console.log("Report pressed");
    setIsMenuOpen(false);
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={onClose} hitSlop={8}>
        <Ionicons name="chevron-back-outline" size={28} color="#000" />
      </Pressable>

      <View style={styles.titleContainer}>
        <Text style={styles.brandText}>{brandName}</Text>
        <Text
          style={styles.productText}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {productName}
        </Text>
      </View>

      <View style={styles.optionsContainer}>
        <Pressable onPress={handleToggleMenu} hitSlop={8}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#000" />
        </Pressable>

        <Modal
          visible={isMenuOpen}
          transparent
          animationType="fade"
          onRequestClose={handleCloseMenu}
        >
          <Pressable style={styles.overlay} onPress={handleCloseMenu}>
            <View style={styles.dropdownContainer}>
              <Pressable style={styles.dropdown} onPress={() => {}}>
                <Pressable
                  style={styles.menuItem}
                  onPress={handleAddToWishlist}
                >
                  <Ionicons
                    name={
                      isWishlisted
                        ? "heart-circle-outline"
                        : "heart-dislike-circle-outline"
                    }
                    size={20}
                    color="#000"
                  />
                  <Text style={[styles.menuItemText, { marginLeft: 12 }]}>
                    Add to Wishlist
                  </Text>
                </Pressable>

                <Pressable style={styles.menuItem} onPress={handleShare}>
                  <Ionicons name="share-outline" size={20} color="#000" />
                  <Text style={[styles.menuItemText, { marginLeft: 12 }]}>
                    Share Product
                  </Text>
                </Pressable>

                <Pressable style={styles.menuItem} onPress={handleReport}>
                  <Ionicons name="warning-outline" size={20} color="red" />
                  <Text style={[styles.menuItemText, styles.reportText, { marginLeft: 12 }]}>
                    Report
                  </Text>
                </Pressable>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "white",
    position: "relative",
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: 12,
    alignItems: "center",
  },
  brandText: {
    fontSize: 12,
    color: "#6B7280",
  },
  productText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginTop: 2,
  },
  optionsContainer: {
    position: "relative",
  },
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  dropdownContainer: {
    position: "absolute",
    top: 60,
    right: 16,
    alignItems: "flex-end",
  },
  dropdown: {
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 180,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemText: {
    fontSize: 14,
    color: "#111827",
  },
  reportText: {
    color: "red",
  },
});

