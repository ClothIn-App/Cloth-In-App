import React from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { IconSymbol } from "@/components/ui/IconSymbol";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect?: (option: "fitPic" | "product") => void;
};

const SCREEN_WIDTH = Dimensions.get("window").width;
const BOX_WIDTH = 120;
const BOX_HEIGHT = 120;
const BOX_SPACING = 20;

export function CreateActionBubbles({ visible, onClose, onSelect }: Props) {

  const handleFitPicPress = () => {
    onSelect?.("fitPic");
    onClose();
    router.push("/create-modals/fitpic_media");
  };

  const handleProductPress = () => {
    onSelect?.("product");
    onClose();
    router.push("/create-modals/addproduct");
  };

  const leftBoxX = SCREEN_WIDTH / 2 - BOX_WIDTH - BOX_SPACING / 2;
  const rightBoxX = SCREEN_WIDTH / 2 + BOX_SPACING / 2;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.scrim}>
        <Pressable style={styles.scrimPressable} onPress={onClose} />
      </View>
      
      {/* Left box - Fit Pic */}
      <View
        style={[
          styles.box,
          {
            left: leftBoxX,
          },
        ]}
      >
        <Pressable
          style={styles.boxPressable}
          onPress={handleFitPicPress}
          hitSlop={10}
        >
          <View style={styles.iconContainer}>
            <IconSymbol name="camera.fill" color="white" size={40} />
          </View>
          <Text style={styles.boxLabel}>Fit-Pic</Text>
        </Pressable>
      </View>

      {/* Right box - Product */}
      <View
        style={[
          styles.box,
          {
            left: rightBoxX,
          },
        ]}
      >
        <Pressable
          style={styles.boxPressable}
          onPress={handleProductPress}
          hitSlop={10}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="bag" color="white" size={40} />
          </View>
          <Text style={styles.boxLabel}>Add Product</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)", // Darker background
  },
  scrimPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  box: {
    position: "absolute",
    bottom: 100, // Position above the tab bar
    width: BOX_WIDTH,
    height: BOX_HEIGHT,
    backgroundColor: "black",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  boxPressable: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  iconContainer: {
    marginBottom: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  boxLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
    textAlign: "center",
  },
});
