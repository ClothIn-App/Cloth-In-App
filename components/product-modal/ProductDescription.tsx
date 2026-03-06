import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

type ProductDescriptionProps = {
  description?: string;
  specs?: string;
};

export function ProductDescription({
  description,
  specs,
}: ProductDescriptionProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isSpecsExpanded, setIsSpecsExpanded] = useState(false);

  const hasDescription = !!description && description.trim().length > 0;
  const hasSpecs = !!specs && specs.trim().length > 0;

  const shouldShowDescriptionToggle = hasDescription && description!.length > 100;
  const shouldShowSpecsToggle = hasSpecs && specs!.length > 100;

  const toggleDescription = () => {
    setIsDescriptionExpanded(!isDescriptionExpanded);
  };

  const toggleSpecs = () => {
    setIsSpecsExpanded(!isSpecsExpanded);
  };

  if (!hasDescription && !hasSpecs) return null;

  return (
    <View style={styles.container}>
      {hasSpecs && (
        <View style={[styles.section, !hasDescription && styles.lastSection]}>
          <Text style={styles.sectionTitle}>Specifications</Text>
          <Text
            style={styles.bodyText}
            numberOfLines={isSpecsExpanded ? undefined : 2}
          >
            {specs}
          </Text>
          {shouldShowSpecsToggle && (
            <Pressable onPress={toggleSpecs} hitSlop={8}>
              <Text style={styles.toggleText}>
                {isSpecsExpanded ? "Show less ▴" : "Show more ▾"}
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {hasDescription && (
        <View style={[styles.section, styles.lastSection]}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text
            style={styles.bodyText}
            numberOfLines={isDescriptionExpanded ? undefined : 2}
          >
            {description}
          </Text>
          {shouldShowDescriptionToggle && (
            <Pressable onPress={toggleDescription} hitSlop={8}>
              <Text style={styles.toggleText}>
                {isDescriptionExpanded ? "Show less ▴" : "Show more ▾"}
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "white",
  },
  section: {
    marginBottom: 16,
  },
  lastSection: {
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 4,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#4B5563",
    marginTop: 4,
  },
});

