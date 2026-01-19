import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

type Props = {
  visible: boolean;
  title: string;
  submitLabel: string;
  initialValue?: string;
  existingNames?: string[];
  onClose: () => void;
  onSubmit: (name: string) => void;
  maxLength?: number;
};

export default function RackNameModal({
  visible,
  title,
  submitLabel,
  initialValue = "",
  existingNames = [],
  onClose,
  onSubmit,
  maxLength = 32,
}: Props) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<TextInput | null>(null);

  useEffect(() => {
    if (!visible) return;
    setValue(initialValue);
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [visible, initialValue]);

  const trimmed = value.trim();
  const lowerSet = useMemo(
    () => new Set(existingNames.map((n) => n.trim().toLowerCase()).filter(Boolean)),
    [existingNames]
  );

  const isDuplicate =
    trimmed.length > 0 &&
    lowerSet.has(trimmed.toLowerCase()) &&
    trimmed.toLowerCase() !== initialValue.trim().toLowerCase();

  const error =
    trimmed.length === 0
      ? "Name can’t be empty."
      : isDuplicate
        ? "A rack with this name already exists."
        : undefined;

  const canSubmit = !error && trimmed.length > 0 && trimmed.length <= maxLength;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <Text style={styles.title}>{title}</Text>

            <TextInput
              ref={inputRef}
              value={value}
              onChangeText={(t) => {
                if (t.length <= maxLength) setValue(t);
              }}
              placeholder="Rack name"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              autoCorrect={false}
              style={styles.input}
              returnKeyType="done"
              onSubmitEditing={() => {
                if (!canSubmit) return;
                onSubmit(trimmed);
                onClose();
              }}
            />

            <View style={styles.row}>
              <Text style={[styles.helper, !!error && styles.helperError]}>
                {error ?? `${trimmed.length}/${maxLength}`}
              </Text>
            </View>

            <View style={styles.actions}>
              <Pressable onPress={onClose} style={[styles.btn, styles.btnSecondary]}>
                <Text style={[styles.btnText, styles.btnTextSecondary]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (!canSubmit) return;
                  onSubmit(trimmed);
                  onClose();
                }}
                style={[styles.btn, !canSubmit && styles.btnDisabled]}
                accessibilityRole="button"
                accessibilityLabel={submitLabel}
              >
                <Text style={styles.btnText}>{submitLabel}</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#11181C",
    textAlign: "center",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#11181C",
    backgroundColor: "#fff",
  },
  row: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  helper: {
    fontSize: 12,
    color: "#6B7280",
  },
  helperError: {
    color: "#B91C1C",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  btn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#11181C",
  },
  btnSecondary: {
    backgroundColor: "#F3F4F6",
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  btnTextSecondary: {
    color: "#11181C",
  },
});

