// src/FitPic/post/components/CaptionInput.tsx
import React, { useMemo } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

export type CaptionInputProps = {
  value: string;
  onChange: (v: string) => void; 
  max: number;                  
};

export default function CaptionInput({ value, onChange, max }: CaptionInputProps) {
  // show helper when within 200 chars of the cap (e.g., 2000/2200)
  const remaining = Math.max(0, max - (value?.length ?? 0));
  const showHelper = remaining <= 200;

  const helperText = useMemo(() => {
    if (remaining === 0) return 'You’ve reached the limit.';
    if (remaining <= 25) return `${remaining} characters left`;
    return `Approaching the limit — ${remaining} left`;
  }, [remaining]);

  const handleChange = (text: string) => {
    // extra guard; parent setter also slices to max
    const next = text.length > max ? text.slice(0, max) : text;
    onChange(next);
  };

  return (
    <View style={S.wrap}>
      <TextInput
        placeholder="Write a caption…"
        value={value}
        onChangeText={handleChange}
        multiline
        style={S.input}
        textAlignVertical="top"
        placeholderTextColor="#9ca3af"
        // Using maxLength here improves UX on both iOS/Android
        maxLength={max}
        accessibilityLabel="Post caption"
      />
      <View style={S.footerRow} accessible accessibilityLabel={`Characters remaining: ${remaining}`}>
        <Text style={[S.counter, showHelper && S.counterNear]}>
          {value.length}/{max}
        </Text>
        {showHelper && <Text style={S.helper}>{helperText}</Text>}
      </View>
    </View>
  );
}

const S = StyleSheet.create({
  wrap: { gap: 6 },
  input: {
    minHeight: 120,
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    color: '#111827',
    fontSize: 14,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  counter: { color: '#6b7280', fontSize: 12 },
  counterNear: { color: '#374151', fontWeight: '600' },
  helper: { color: '#6b7280', fontSize: 12 },
});
