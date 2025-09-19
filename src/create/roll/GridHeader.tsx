// src/create/roll/GridHeader.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

type GridHeaderProps = {
  title: string;
  onClose: () => void;
  onNext: () => void;
  selectedCount: number;
  disabled?: boolean;
  buttonText?: string;
};

export default function GridHeader({
  title,
  onClose,
  onNext,
  selectedCount,
  disabled = false,
  buttonText = 'Next',
}: GridHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onClose} hitSlop={8} style={styles.left}>
        <Text style={styles.x}>✕</Text>
      </Pressable>

      <Text style={styles.title}>{title}</Text>

      <Pressable
        onPress={onNext}
        hitSlop={8}
        style={[styles.right, disabled && styles.disabled]}
        disabled={disabled}
      >
        <Text style={[styles.next, disabled && styles.disabledText]}>
          {buttonText} {selectedCount > 0 && `(${selectedCount})`}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  left: {
    padding: 4,
  },
  x: {
    fontSize: 18,
    color: '#374151',
    fontWeight: '600',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  right: {
    padding: 4,
  },
  next: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#9ca3af',
  },
});
