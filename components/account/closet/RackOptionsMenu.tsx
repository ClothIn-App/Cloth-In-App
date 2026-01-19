import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable } from "react-native";

type Props = {
  visible: boolean;
  rackName: string;
  pinned: boolean;
  onClose: () => void;
  onViewRack: () => void;
  onRenameRack: () => void;
  onTogglePin: () => void;
  onDeleteRack: () => void;
};

export default function RackOptionsMenu({
  visible,
  rackName,
  pinned,
  onClose,
  onViewRack,
  onRenameRack,
  onTogglePin,
  onDeleteRack,
}: Props) {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.bottomSheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.headerText}>{rackName}</Text>
          </View>

          <View style={styles.optionsContainer}>
            <TouchableOpacity style={styles.option} onPress={onViewRack} activeOpacity={0.7}>
              <Text style={styles.optionText}>View rack</Text>
            </TouchableOpacity>
            <View style={styles.divider} />

            <TouchableOpacity style={styles.option} onPress={onRenameRack} activeOpacity={0.7}>
              <Text style={styles.optionText}>Edit rack name</Text>
            </TouchableOpacity>
            <View style={styles.divider} />

            <TouchableOpacity style={styles.option} onPress={onTogglePin} activeOpacity={0.7}>
              <Text style={styles.optionText}>{pinned ? "Unpin rack" : "Pin rack"}</Text>
            </TouchableOpacity>
            <View style={styles.divider} />

            <TouchableOpacity style={styles.option} onPress={onDeleteRack} activeOpacity={0.7}>
              <Text style={[styles.optionText, styles.destructive]}>Delete rack</Text>
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

