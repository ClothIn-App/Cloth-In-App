/**
 * CollapsibleText Component
 * Displays text with show more/show less functionality
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  text: string;
  maxLines?: number;
  title?: string;
  style?: any;
};

export default function CollapsibleText({ text, maxLines = 2, title, style }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldShowButton, setShouldShowButton] = useState(false);

  const handleTextLayout = (event: any) => {
    const { lines } = event.nativeEvent;
    setShouldShowButton(lines.length > maxLines);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <View style={[styles.container, style]}>
      {title && <Text style={styles.title}>{title}</Text>}
      <Text
        style={styles.text}
        numberOfLines={isExpanded ? undefined : maxLines}
        onTextLayout={handleTextLayout}
      >
        {text}
      </Text>
      {shouldShowButton && (
        <TouchableOpacity onPress={toggleExpanded} style={styles.button}>
          <Text style={styles.buttonText}>
            {isExpanded ? 'Show Less' : 'Show More'}
          </Text>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color="#6B7280"
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#11181C',
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  buttonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
});
