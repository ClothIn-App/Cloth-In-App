import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  GestureHandlerRootView,
  PanGestureHandler,
  State,
} from 'react-native-gesture-handler';
import StreakCalendar from './StreakCalendar';
import { useStreakData } from '../../src/hooks/useStreakData';
import { router } from 'expo-router';
import type { FitPic } from '../../src/types/fitpic';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.9; // 90% of screen width

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function MemoriesDrawer({ visible, onClose }: Props) {
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const dragX = useRef(new Animated.Value(0)).current;

  const { currentStreak, longestStreak, fitpicsByDate, loading, todayLocalDate } =
    useStreakData();

  const openAnim = useCallback(() => {
    dragX.setValue(0);
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [translateX, backdropOpacity, dragX]);

  const closeAnim = useCallback(
    (cb?: () => void) => {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -DRAWER_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        dragX.setValue(0);
        if (finished) cb?.();
      });
    },
    [translateX, backdropOpacity, dragX]
  );

  useEffect(() => {
    if (visible) {
      openAnim();
    } else {
      translateX.setValue(-DRAWER_WIDTH);
      backdropOpacity.setValue(0);
      dragX.setValue(0);
    }
  }, [visible, openAnim, translateX, backdropOpacity, dragX]);

  const handleClose = useCallback(() => {
    closeAnim(onClose);
  }, [closeAnim, onClose]);

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: dragX } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = useCallback(
    (e: any) => {
      const { state, translationX, velocityX } = e.nativeEvent || {};
      if (state === State.END || state === State.CANCELLED || state === State.FAILED) {
        const shouldClose = translationX < -80 || (velocityX ?? 0) < -1200;
        if (shouldClose) {
          handleClose();
        } else {
          Animated.spring(dragX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 0,
            speed: 20,
          }).start();
        }
      }
    },
    [dragX, handleClose]
  );

  const dragClamped = dragX.interpolate({
    inputRange: [-DRAWER_WIDTH, 0, DRAWER_WIDTH],
    outputRange: [-DRAWER_WIDTH, 0, 0],
    extrapolate: 'clamp',
  });

  const combinedTranslateX = Animated.add(translateX, dragClamped);

  const handleDayPress = useCallback((fitpic: FitPic) => {
    router.push({
      pathname: '/fitpic-detail',
      params: { id: fitpic.id },
    });
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <GestureHandlerRootView style={StyleSheet.absoluteFill}>
      <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
        {/* Backdrop */}
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: 'rgba(0, 0, 0, 0.28)', opacity: backdropOpacity },
            ]}
          />
        </Pressable>

        {/* Drawer */}
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
          activeOffsetX={[-10, 10]}
          failOffsetY={[-50, 50]}
        >
          <Animated.View
            style={[
              styles.drawer,
              {
                width: DRAWER_WIDTH,
                transform: [{ translateX: combinedTranslateX }],
              },
            ]}
          >
            <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Memories</Text>
                <TouchableOpacity
                  onPress={handleClose}
                  style={styles.closeButton}
                  hitSlop={8}
                >
                  <Ionicons name="close" size={24} color="#11181C" />
                </TouchableOpacity>
              </View>

              {/* Streak Stats */}
              <View style={styles.streakStats}>
                <View style={styles.streakItem}>
                  <Text style={styles.streakLabel}>Current Streak</Text>
                  <Text style={styles.streakNumber}>{currentStreak}</Text>
                </View>
                <View style={styles.streakItem}>
                  <Text style={styles.streakLabel}>Longest Streak</Text>
                  <Text style={styles.streakNumber}>{longestStreak}</Text>
                </View>
              </View>

              {/* Calendar */}
              <View style={styles.calendarContainer}>
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading memories...</Text>
                  </View>
                ) : (
                  <StreakCalendar
                    fitpicsByDate={fitpicsByDate}
                    todayLocalDate={todayLocalDate}
                    visible={visible}
                    onDayPress={handleDayPress}
                    contentWidth={DRAWER_WIDTH - 32}
                  />
                )}
              </View>
            </SafeAreaView>
          </Animated.View>
        </PanGestureHandler>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: SCREEN_HEIGHT,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#11181C',
  },
  closeButton: {
    padding: 4,
  },
  streakStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5',
  },
  streakItem: {
    alignItems: 'center',
    gap: 8,
  },
  streakLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666A70',
  },
  streakNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FF6B35',
  },
  calendarContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#666A70',
  },
});
