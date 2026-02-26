import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

const BORDER = '#E2E8F0';

export type LocationInputProps = {
  value: string;
  onChange: (v: string) => void;
};

export default function LocationInput({ value, onChange }: LocationInputProps) {
  return (
    <View style={styles.wrap}>
      <TextInput
        placeholder="Add location"
        value={value}
        onChangeText={onChange}
        style={styles.input}
        placeholderTextColor="#9ca3af"
        accessibilityLabel="Post location"
        returnKeyType="done"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  input: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#111827',
  },
});
