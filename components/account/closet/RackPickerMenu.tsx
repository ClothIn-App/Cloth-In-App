import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable, ScrollView } from "react-native";

type Rack = { id: string; name: string };

type Props = {
  visible: boolean;
  racks: Rack[];
  onClose: () => void;
  onSelectRack: (rackId: string) => void;
};

export default function RackPickerMenu({ visible, racks, onClose, onSelectRack }: Props) {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.bottomSheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Move to rack</Text>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            {racks.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No racks yet.</Text>
              </View>
            ) : (
              racks.map((r, idx) => (
                <View key={r.id}>
                  <TouchableOpacity
                    style={styles.option}
                    onPress={() => onSelectRack(r.id)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Move to ${r.name}`}
                  >
                    <Text style={styles.optionText}>{r.name}</Text>
                  </TouchableOpacity>
                  {idx !== racks.length - 1 && <View style={styles.divider} />}
                </View>
              ))
            )}
          </ScrollView>

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
  scroll: {
    maxHeight: 360,
  },
  scrollContent: {
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
  empty: {
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
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

