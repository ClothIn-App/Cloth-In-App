import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { CreateTile } from "./CreateTile";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect?: (option: "fitPic" | "product") => void;
};

const SCREEN_HEIGHT = Dimensions.get("window").height;
const OPEN_Y = 0;
const CLOSED_Y = SCREEN_HEIGHT;

export function CreateSheet({ visible, onClose, onSelect }: Props) {
  const baseY = useRef(new Animated.Value(CLOSED_Y)).current;
  const dragY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(baseY, {
      toValue: visible ? OPEN_Y : CLOSED_Y,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      if (!visible) dragY.setValue(0);
    });
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 5,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) dragY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        const shouldClose = g.dy > 120 || g.vy > 0.8;
        if (shouldClose) {
          Animated.timing(baseY, {
            toValue: CLOSED_Y,
            duration: 180,
            useNativeDriver: true,
          }).start(onClose);
        } else {
          Animated.spring(dragY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const translateY = Animated.add(baseY, dragY);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]} {...panResponder.panHandlers}>
        <View style={styles.grabber} />
        <Text style={styles.title}>Create</Text>

        <CreateTile
          title="Fit Pic"
          subtitle="Photo/video up to 10s"
          bold
          onPress={() => {
            onSelect?.("fitPic");
            onClose();
            router.push("/modals/fitpic_media");
          }}
        />

        <CreateTile
          title="Product"
          subtitle="Add or suggest a product"
          onPress={() => {
            onSelect?.("product");
            // router.push("/modals/selectproducts"); // when ready
          }}
        />
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    paddingBottom: 28,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: "white",
  },
  grabber: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#d1d5db",
    marginBottom: 12,
  },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 16 },
});