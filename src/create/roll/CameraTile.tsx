// src/create/roll/CameraTile.tsx
import React, { memo } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';

type CameraTileProps = {
  onPress: () => void;
};

const CameraTile = memo(function CameraTile({ onPress }: CameraTileProps) {
  return (
    <Pressable onPress={onPress} style={[styles.cell, styles.cameraCell]}>
      <Text style={styles.cameraEmoji}>📷</Text>
      <Text style={styles.cameraLabel}>Camera</Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  cell: {
    aspectRatio: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraCell: {
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
  },
  cameraEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  cameraLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
});

export default CameraTile;
