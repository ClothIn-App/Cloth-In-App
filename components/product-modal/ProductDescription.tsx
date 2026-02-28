import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

type ProductDescriptionProps = {
  description?: string;
  details?: string;
};

export function ProductDescription({
  description,
  details,
}: ProductDescriptionProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

  const hasDescription = !!description && description.trim().length > 0;
  const hasDetails = !!details && details.trim().length > 0;

  const shouldShowDescriptionToggle = hasDescription && description!.length > 100;
  const shouldShowDetailsToggle = hasDetails && details!.length > 100;

  const toggleDescription = () => {
    setIsDescriptionExpanded(!isDescriptionExpanded);
  };

  const toggleDetails = () => {
    setIsDetailsExpanded(!isDetailsExpanded);
  };

  if (!hasDescription && !hasDetails) return null;

  return (
    <View style={styles.container}>
      {hasDescription && (
        <View style={styles.section}>
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

      {hasDetails && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <Text
            style={styles.bodyText}
            numberOfLines={isDetailsExpanded ? undefined : 2}
          >
            {details}
          </Text>
          {shouldShowDetailsToggle && (
            <Pressable onPress={toggleDetails} hitSlop={8}>
              <Text style={styles.toggleText}>
                {isDetailsExpanded ? "Show less ▴" : "Show more ▾"}
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
    marginBottom: 24,
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

