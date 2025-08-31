// app/features/fitpic/fitpicpager.tsx
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  Dimensions,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  View,
} from 'react-native';
// ✅ Use RNGH ScrollView to coexist with other gestures
import { ScrollView } from 'react-native-gesture-handler';

type Index = 0 | 1;

export type FitPicPagerProps = {
  /** Starting page: 0 = Camera Roll, 1 = Capture (default: 1) */
  initialIndex?: Index;
  /** Called when the page changes to 0 or 1 */
  onIndexChange?: (i: Index) => void;
  /** Render function for the Camera Roll page (index 0) */
  renderCameraRoll: () => React.ReactNode;
  /** Render function for the Capture page (index 1) */
  renderCapture: () => React.ReactNode;
};

export type FitPicPagerHandle = {
  /** Programmatically navigate to page 0 (Roll) or 1 (Capture) */
  scrollTo: (index: Index, animated?: boolean) => void;
};

const clampToIndex = (n: number): Index => (n <= 0 ? 0 : 1);

const FitPicPager = forwardRef<FitPicPagerHandle, FitPicPagerProps>(
  (
    { initialIndex = 1, onIndexChange, renderCameraRoll, renderCapture }: FitPicPagerProps,
    ref
  ) => {
    const scrollRef = useRef<ScrollView>(null);

    // Ensure we have a usable width before first scroll.
    const [width, setWidth] = useState<number>(Math.max(1, Dimensions.get('window').width));

    const [currentIndex, setCurrentIndex] = useState<Index>(initialIndex);

    const handleLayout = useCallback((e: LayoutChangeEvent) => {
      const w = Math.max(1, e.nativeEvent.layout.width);
      if (w !== width) setWidth(w);
    }, [width]);

    const scrollTo = useCallback(
      (index: Index, animated: boolean = true) => {
        if (!scrollRef.current) return;
        scrollRef.current.scrollTo({ x: index * width, y: 0, animated });
      },
      [width]
    );

    useImperativeHandle(ref, () => ({ scrollTo }), [scrollTo]);

    // Honor initialIndex when width becomes known or changes.
    useEffect(() => {
      // prevent animation on first sync to avoid flicker
      scrollTo(initialIndex, false);
      setCurrentIndex(initialIndex);
    }, [initialIndex, width, scrollTo]);

    const onMomentumEnd = useCallback(
      (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetX = e.nativeEvent.contentOffset.x;
        const next = clampToIndex(Math.round(offsetX / Math.max(1, width)));
        if (next !== currentIndex) {
          setCurrentIndex(next);
          onIndexChange?.(next);
        }
      },
      [currentIndex, onIndexChange, width]
    );

    return (
      <View style={styles.container} onLayout={handleLayout}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          bounces={false}
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          decelerationRate="fast"
          onMomentumScrollEnd={onMomentumEnd}
          scrollEventThrottle={16}
          style={{ flex: 1 }}               // ✅ ensure full size
        >
          {/* index 0 — Camera Roll */}
          <View style={[styles.page, { width }]}>
            {renderCameraRoll()}
          </View>

          {/* index 1 — Capture (default) */}
          <View style={[styles.page, { width }]}>
            {renderCapture()}
          </View>
        </ScrollView>
      </View>
    );
  }
);

FitPicPager.displayName = 'FitPicPager';

export default FitPicPager;
export type { Index as FitPicPagerIndex };

const styles = StyleSheet.create({
  container: { flex: 1 },
  page: { height: '100%' },
});