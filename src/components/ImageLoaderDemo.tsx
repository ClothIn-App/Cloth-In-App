/**
 * ImageLoaderDemo Component
 * Demonstrates the ImageWithLoader component with different loading states
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import ImageWithLoader from './ImageWithLoader';

const { width: screenWidth } = Dimensions.get('window');

export default function ImageLoaderDemo() {
  const [showSlowImages, setShowSlowImages] = useState(false);

  // Test images with different loading characteristics
  const testImages = [
    {
      id: '1',
      url: 'https://picsum.photos/400/400?random=1',
      title: 'Fast Loading Image',
    },
    {
      id: '2',
      url: 'https://picsum.photos/400/400?random=2',
      title: 'Another Fast Image',
    },
    {
      id: '3',
      url: 'https://picsum.photos/400/400?random=3',
      title: 'Third Image',
    },
    {
      id: '4',
      url: 'https://picsum.photos/400/400?random=4',
      title: 'Fourth Image',
    },
  ];

  // Simulate slow loading images
  const slowImages = [
    {
      id: 'slow1',
      url: 'https://httpbin.org/delay/3', // This will fail, showing error state
      title: 'Slow Loading Image (Error)',
    },
    {
      id: 'slow2',
      url: 'https://picsum.photos/400/400?random=5&delay=2000',
      title: 'Slow Loading Image (2s delay)',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Image Loading Animation Demo</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fast Loading Images</Text>
        <View style={styles.grid}>
          {testImages.map((image) => (
            <View key={image.id} style={styles.imageContainer}>
              <ImageWithLoader
                source={{ uri: image.url }}
                style={styles.image}
                resizeMode="cover"
              />
              <Text style={styles.imageTitle}>{image.title}</Text>
            </View>
          ))}
        </View>
      </View>

      <Pressable
        style={styles.button}
        onPress={() => setShowSlowImages(!showSlowImages)}
      >
        <Text style={styles.buttonText}>
          {showSlowImages ? 'Hide' : 'Show'} Slow Loading Images
        </Text>
      </Pressable>

      {showSlowImages && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Slow Loading Images</Text>
          <View style={styles.grid}>
            {slowImages.map((image) => (
              <View key={image.id} style={styles.imageContainer}>
                <ImageWithLoader
                  source={{ uri: image.url }}
                  style={styles.image}
                  resizeMode="cover"
                />
                <Text style={styles.imageTitle}>{image.title}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Features:</Text>
        <Text style={styles.infoText}>• Shimmer loading animation</Text>
        <Text style={styles.infoText}>• Smooth fade-in when loaded</Text>
        <Text style={styles.infoText}>• Error state handling</Text>
        <Text style={styles.infoText}>• Customizable skeleton colors</Text>
        <Text style={styles.infoText}>• Works with any image source</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    color: '#1f2937',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#374151',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  imageContainer: {
    width: (screenWidth - 48) / 2,
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },
  imageTitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
    color: '#6b7280',
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 24,
    alignSelf: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1f2937',
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
});
