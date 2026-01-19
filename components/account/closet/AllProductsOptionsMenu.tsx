import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable } from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSort: () => void;
  onFilter: () => void;
  onSelectMode: () => void;
};

export default function AllProductsOptionsMenu({
  visible,
  onClose,
  onSort,
  onFilter,
  onSelectMode,
}: Props) {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.bottomSheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.headerText}>All Products</Text>
          </View>

          <View style={styles.optionsContainer}>
            <TouchableOpacity style={styles.option} onPress={onSort} activeOpacity={0.7}>
              <Text style={styles.optionText}>Sort</Text>
            </TouchableOpacity>
            <View style={styles.divider} />

            <TouchableOpacity style={styles.option} onPress={onFilter} activeOpacity={0.7}>
              <Text style={styles.optionText}>Filter</Text>
            </TouchableOpacity>
            <View style={styles.divider} />

            <TouchableOpacity style={styles.option} onPress={onSelectMode} activeOpacity={0.7}>
              <Text style={styles.optionText}>Select</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  bottomSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
    maxHeight: "80%",
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E6E6E6",
  },
  headerText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    textAlign: "center",
  },
  optionsContainer: {
    paddingVertical: 8,
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  optionText: {
    fontSize: 16,
    color: "#000",
    fontWeight: "400",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E6E6E6",
    marginLeft: 16,
  },
  cancelButton: {
    marginTop: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E6E6E6",
  },
  cancelText: {
    fontSize: 16,
    color: "#000",
    fontWeight: "600",
    textAlign: "center",
  },
});

