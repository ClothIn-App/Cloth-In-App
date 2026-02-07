import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import {
  GestureHandlerRootView,
  PanGestureHandler,
  State,
} from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const CLOSE_THRESHOLD = 60;
const CLOSE_VELOCITY = 300;
const CALENDAR_MONTHS_COUNT = 12;

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isFuture(year: number, month: number, day: number): boolean {
  const today = new Date();
  const d = new Date(year, month, day);
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d > today;
}

function buildMonthGrid(year: number, month: number): (number | null)[] {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const leading = Array(firstDay).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  return [...leading, ...days];
}

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function StreakDrawer({ visible, onClose }: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const drawerWidth = screenWidth * 0.85;

  const baseTranslateX = useRef(new Animated.Value(-drawerWidth)).current;
  const dragX = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const openAnim = useCallback(() => {
    dragX.setValue(0);
    baseTranslateX.setValue(-drawerWidth);
    Animated.parallel([
      Animated.timing(baseTranslateX, {
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
  }, [baseTranslateX, backdropOpacity, dragX, drawerWidth]);

  const closeAnim = useCallback(
    (cb?: () => void) => {
      Animated.parallel([
        Animated.timing(baseTranslateX, {
          toValue: -drawerWidth,
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
    [baseTranslateX, backdropOpacity, dragX, drawerWidth]
  );

  useEffect(() => {
    if (visible) {
      openAnim();
    } else {
      baseTranslateX.setValue(-drawerWidth);
      backdropOpacity.setValue(0);
      dragX.setValue(0);
    }
  }, [visible, openAnim, drawerWidth, baseTranslateX, backdropOpacity, dragX]);

  const handleClose = useCallback(() => {
    closeAnim(onClose);
  }, [closeAnim, onClose]);

  const onGestureEvent = useMemo(
    () =>
      Animated.event([{ nativeEvent: { translationX: dragX } }], {
        useNativeDriver: true,
      }),
    [dragX]
  );

  const onHandlerStateChange = useCallback(
    (e: { nativeEvent: { state: number; translationX: number; velocityX: number } }) => {
      const { state, translationX, velocityX } = e.nativeEvent;
      if (state === State.END || state === State.CANCELLED || state === State.FAILED) {
        const shouldClose =
          translationX < -CLOSE_THRESHOLD || velocityX < -CLOSE_VELOCITY;
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
    inputRange: [-drawerWidth, 0],
    outputRange: [-drawerWidth, 0],
    extrapolate: "clamp",
  });

  const combinedTranslateX = Animated.add(baseTranslateX, dragClamped);

  // Hardcoded for UI; will connect to data later
  const currentStreak = 7;
  const longestStreak = 15;

  // Calendar: list of months (oldest first, newest last) for continuous scroll
  const monthList = useMemo(() => {
    const now = new Date();
    const list: { year: number; month: number }[] = [];
    for (let i = CALENDAR_MONTHS_COUNT - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      list.push({ year: d.getFullYear(), month: d.getMonth() });
    }
    return list;
  }, []);

  const daysWithFitPic = useMemo(() => new Set([3, 7, 14]), []);

  const calendarPadding = 16;
  const cellGap = 8;
  const gridWidth = drawerWidth - calendarPadding * 2;
  const cellWidth = (gridWidth - cellGap * 6) / 7;
  const cellHeight = cellWidth * (4 / 3);

  const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

  const scrollRef = useRef<ScrollView>(null);
  useEffect(() => {
    if (visible) {
      scrollRef.current?.scrollToEnd({ animated: false });
    }
  }, [visible]);

  const handleDayPress = useCallback((_day: number) => {
    // TODO: connect to mocks/API and router.push fitpic-detail
  }, []);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <GestureHandlerRootView style={styles.modalRoot}>
        <Pressable style={styles.backdrop} onPress={handleClose}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: "rgba(0,0,0,0.5)", opacity: backdropOpacity },
            ]}
          />
        </Pressable>

        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
          activeOffsetX={[-20, 20]}
        >
          <Animated.View
            style={[
              styles.drawer,
              {
                width: drawerWidth,
                transform: [{ translateX: combinedTranslateX }],
                overflow: "hidden",
              },
            ]}
          >
            <View
              style={[
                styles.drawerContent,
                { paddingTop: insets.top, width: drawerWidth },
              ]}
            >
              {/* Section 1: Header */}
              <View style={styles.headerRow}>
                <View style={styles.headerTitleRow}>
                  <Ionicons name="flame" size={22} color="#FF6B35" style={styles.headerFlame} />
                  <Text style={styles.headerTitle}>Memories</Text>
                </View>
                <TouchableOpacity
                  onPress={handleClose}
                  hitSlop={12}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#11181C" />
                </TouchableOpacity>
              </View>

              {/* Section 2: Streak stats */}
              <View style={styles.statsRow}>
                <View style={styles.statColumn}>
                  <Text style={styles.statLabel}>Current Streak</Text>
                  <Text style={[styles.statNumber, currentStreak === 0 && styles.statNumberZero]}>
                    {currentStreak}
                  </Text>
                  <Text style={styles.statUnit}>days</Text>
                </View>
                <View style={styles.statColumn}>
                  <Text style={styles.statLabel}>Longest Streak</Text>
                  <Text style={[styles.statNumber, longestStreak === 0 && styles.statNumberZero]}>
                    {longestStreak}
                  </Text>
                  <Text style={styles.statUnit}>days</Text>
                </View>
              </View>

              {/* Section 3: Calendar (continuous scroll, oldest first, latest at bottom) */}
              <View style={styles.calendarSection}>
                <ScrollView
                  ref={scrollRef}
                  style={{ flex: 1 }}
                  contentContainerStyle={{ paddingBottom: cellGap }}
                  showsVerticalScrollIndicator={true}
                >
                  {monthList.map(({ year, month }) => {
                    const monthGrid = buildMonthGrid(year, month);
                    return (
                      <View
                        key={`${year}-${month}`}
                        style={[styles.calendarMonthBlock, { marginBottom: 24 }]}
                      >
                        <Text style={[styles.calendarMonthTitle, { marginBottom: 8 }]}>
                          {MONTH_NAMES[month]} {year}
                        </Text>
                        <View
                          style={[
                            styles.calendarDayLabelsRow,
                            { width: 7 * cellWidth + 6 * cellGap },
                          ]}
                        >
                          {DAY_LABELS.map((letter, i) => (
                            <Text
                              key={i}
                              style={[
                                styles.calendarDayLabel,
                                { width: cellWidth, marginRight: i < 6 ? cellGap : 0 },
                              ]}
                              numberOfLines={1}
                            >
                              {letter}
                            </Text>
                          ))}
                        </View>
                        <View
                          style={[
                            styles.calendarGrid,
                            {
                              width: 7 * cellWidth + 6 * cellGap,
                              marginTop: 4,
                            },
                          ]}
                        >
                          {monthGrid.map((day, index) => {
                            const cellStyle = {
                              width: cellWidth,
                              height: cellHeight,
                              marginRight: index % 7 === 6 ? 0 : cellGap,
                              marginBottom: cellGap,
                            };
                            if (day === null) {
                              return (
                                <View
                                  key={`empty-${index}`}
                                  style={[styles.dayCell, styles.dayCellEmpty, cellStyle]}
                                />
                              );
                            }
                            const future = isFuture(year, month, day);
                            const hasFitPic = daysWithFitPic.has(day);
                            if (future) {
                              return (
                                <View
                                  key={day}
                                  style={[styles.dayCell, styles.dayCellFuture, cellStyle]}
                                />
                              );
                            }
                            if (hasFitPic) {
                              return (
                                <TouchableOpacity
                                  key={day}
                                  activeOpacity={0.8}
                                  onPress={() => handleDayPress(day)}
                                  style={[styles.dayCell, styles.dayCellWithFitPic, cellStyle]}
                                >
                                  <View style={styles.dayCellImagePlaceholder} />
                                </TouchableOpacity>
                              );
                            }
                            return (
                              <View
                                key={day}
                                style={[styles.dayCell, styles.dayCellMissed, cellStyle]}
                              />
                            );
                          })}
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          </Animated.View>
        </PanGestureHandler>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  drawer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#fff",
  },
  drawerContent: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e5e5",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerFlame: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#11181C",
  },
  closeButton: {
    padding: 8,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e5e5",
  },
  statColumn: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 14,
    color: "#666A70",
    marginBottom: 4,
    textAlign: "center",
  },
  statNumber: {
    fontSize: 36,
    fontWeight: "700",
    color: "#FF6B35",
    marginBottom: 2,
    textAlign: "center",
  },
  statNumberZero: {
    color: "#9CA3AF",
  },
  statUnit: {
    fontSize: 12,
    color: "#666A70",
    textAlign: "center",
  },
  calendarSection: {
    flex: 1,
    minHeight: 200,
    paddingTop: 12,
  },
  calendarMonthBlock: {
    paddingHorizontal: 16,
  },
  calendarMonthTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#11181C",
  },
  calendarDayLabelsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 4,
  },
  calendarDayLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666A70",
    textAlign: "center",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    borderRadius: 4,
  },
  dayCellEmpty: {
    backgroundColor: "transparent",
  },
  dayCellFuture: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  dayCellMissed: {
    backgroundColor: "#E5E7EB",
  },
  dayCellWithFitPic: {
    backgroundColor: "#e5e5e5",
    overflow: "hidden",
  },
  dayCellImagePlaceholder: {
    flex: 1,
    backgroundColor: "#FF6B35",
    borderRadius: 4,
  },
});
