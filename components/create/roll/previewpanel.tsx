// app/src/create/cameraroll/PreviewPanel.tsx
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  View,
} from 'react-native';
import { Image } from 'expo-image';
type PreviewPanelProps = {
  /** Image URI for the preview. null hides content */
  uri: string | null;
  /** Controls open/close animation */
  expanded: boolean;
};

const SCREEN_W = Math.round(Dimensions.get('window').width);
const OPEN_HEIGHT = SCREEN_W; // square preview

const PreviewPanel: React.FC<PreviewPanelProps> = ({ uri, expanded }) => {
  const height = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const toValue = expanded && !!uri ? OPEN_HEIGHT : 0;
    Animated.timing(height, {
      toValue,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // height cannot use native driver
    }).start();
  }, [expanded, uri, height]);

  return (
    <Animated.View style={[styles.container, { height }]} testID="preview-panel">
      {/* Only render the image when we have a URI; container height handles show/hide */}
      {!!uri && (
        <View style={styles.square}>
          <Image source={{ uri }} style={styles.image} contentFit="cover" />
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: 'black', // helps avoid flashes during animation
  },
  square: {
    width: SCREEN_W,
    height: OPEN_HEIGHT,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export default React.memo(PreviewPanel);
