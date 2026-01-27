import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable } from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  onMove: () => void;
  onDelete: () => void;
};

export default function ProductActionsMenu({ visible, onClose, onMove, onDelete }: Props) {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.bottomSheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Product</Text>
          </View>

          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={styles.option}
              onPress={onMove}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Move to rack"
            >
              <Text style={styles.optionText}>Move to rack</Text>
            </TouchableOpacity>
            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.option}
              onPress={onDelete}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Delete from closet"
            >
              <Text style={[styles.optionText, styles.destructive]}>Delete from closet</Text>
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
  destructive: {
    color: "#B91C1C",
    fontWeight: "600",
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

