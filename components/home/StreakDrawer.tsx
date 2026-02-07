import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import { getCurrentUserId } from "../../src/services/mockSessionUsers";
import { fitpicClient } from "../../src/services/apiClients/fitpicClient";
import { computeStreakStats } from "../../src/utils/streakUtils";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  PanGestureHandler,
  State,
  TouchableOpacity as GHTouchableOpacity,
} from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
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

type FitpicDayInfo = {
  id: string;
  imageUri: string;
  count: number;
  ids: string[];
  items: { id: string; imageUri: string; createdAt: string }[];
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
      setStreakHelpVisible(false);
      setPickerItems(null);
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

  const handleDayPress = useCallback(
    (fitpicInfo: FitpicDayInfo) => {
      if (fitpicInfo.ids.length > 1) {
        setPickerItems(fitpicInfo.items);
      } else {
        handleClose();
        router.push({ pathname: "/fitpic-detail", params: { id: fitpicInfo.id } });
      }
    },
    [handleClose]
  );

  const handlePickFitpic = useCallback(
    (fitpicId: string) => {
      setPickerItems(null);
      handleClose();
      router.push({ pathname: "/fitpic-detail", params: { id: fitpicId } });
    },
    [handleClose]
  );

  const formatPostTime = (createdAt: string) => {
    const d = new Date(createdAt);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  };

  const [streakHelpVisible, setStreakHelpVisible] = useState(false);
  const [fitpicsByDate, setFitpicsByDate] = useState<Record<string, FitpicDayInfo>>({});
  const [pickerItems, setPickerItems] = useState<{ id: string; imageUri: string; createdAt: string }[] | null>(null);

  const { currentStreak, longestStreak } = useMemo(
    () => computeStreakStats(Object.keys(fitpicsByDate)),
    [fitpicsByDate]
  );

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      setFitpicsByDate({});
      return;
    }
    fitpicClient
      .listByUser(currentUserId, undefined, 200)
      .then((res) => {
        if (cancelled || !res.success || !res.fitpics) return;
        const byDate: Record<string, FitpicDayInfo> = {};
        for (const fp of res.fitpics) {
          const d = new Date(fp.createdAt);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          const uri = fp.photos?.[0]?.url ?? "";
          const item = { id: fp.id, imageUri: uri, createdAt: fp.createdAt };
          if (!byDate[key]) {
            byDate[key] = {
              id: fp.id,
              imageUri: uri,
              count: 1,
              ids: [fp.id],
              items: [item],
            };
          } else {
            byDate[key].count++;
            byDate[key].ids.push(fp.id);
            byDate[key].items.push(item);
          }
        }
        if (!cancelled) setFitpicsByDate(byDate);
      })
      .catch(() => {
        if (!cancelled) setFitpicsByDate({});
      });
    return () => {
      cancelled = true;
    };
  }, [visible]);

  const openHelp = useCallback(() => setStreakHelpVisible(true), []);

  const helpTapGesture = useMemo(
    () =>
      Gesture.Tap().onEnd(() => {
        runOnJS(openHelp)();
      }),
    [openHelp]
  );

  return (
    <>
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
                  <GestureDetector gesture={helpTapGesture}>
                    <View style={styles.helpIconButton} collapsable={false}>
                      <Ionicons name="help-circle-outline" size={20} color="#666A70" />
                    </View>
                  </GestureDetector>
                </View>
                <GHTouchableOpacity
                  onPress={handleClose}
                  hitSlop={12}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#11181C" />
                </GHTouchableOpacity>
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
                            const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                            const fitpicInfo = fitpicsByDate[dateKey];
                            const hasFitPic = !!fitpicInfo;
                            if (future) {
                              return (
                                <View
                                  key={day}
                                  style={[styles.dayCell, styles.dayCellFuture, cellStyle]}
                                >
                                  <Text style={styles.dayCellDayLabelFuture}>{day}</Text>
                                </View>
                              );
                            }
                            if (hasFitPic && fitpicInfo) {
                              const showCountBubble = fitpicInfo.count > 1;
                              return (
                                <View key={day} style={[styles.dayCell, styles.dayCellWithFitPic, cellStyle]}>
                                  <TouchableOpacity
                                    style={StyleSheet.absoluteFill}
                                    activeOpacity={0.8}
                                    onPress={() => handleDayPress(fitpicInfo)}
                                  >
                                    {fitpicInfo.imageUri ? (
                                      <Image
                                        source={{ uri: fitpicInfo.imageUri }}
                                        style={styles.dayCellImage}
                                        resizeMode="cover"
                                      />
                                    ) : (
                                      <View style={styles.dayCellImagePlaceholder} />
                                    )}
                                  </TouchableOpacity>
                                  {showCountBubble && (
                                    <View style={styles.dayCellCountBubble} pointerEvents="none">
                                      <Text style={styles.dayCellCountBubbleText}>×{fitpicInfo.count}</Text>
                                    </View>
                                  )}
                                </View>
                              );
                            }
                            return (
                              <View
                                key={day}
                                style={[styles.dayCell, styles.dayCellMissed, cellStyle]}
                              >
                                <Text style={styles.dayCellDayLabelMissed}>{day}</Text>
                              </View>
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

        {pickerItems !== null && (
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <Pressable
              style={styles.helpOverlay}
              onPress={() => setPickerItems(null)}
            />
            <View style={styles.helpOverlayContent} pointerEvents="box-none">
              <View style={styles.pickerCard}>
                <Text style={styles.pickerTitle}>View Which Post?</Text>
                {pickerItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.pickerOptionRow}
                    onPress={() => handlePickFitpic(item.id)}
                    activeOpacity={0.7}
                  >
                    {item.imageUri ? (
                      <Image
                        source={{ uri: item.imageUri }}
                        style={styles.pickerOptionThumb}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.pickerOptionThumb, styles.pickerOptionThumbPlaceholder]} />
                    )}
                    <Text style={styles.pickerOptionTime}>{formatPostTime(item.createdAt)}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.pickerCancel}
                  onPress={() => setPickerItems(null)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.pickerCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {streakHelpVisible && (
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <Pressable
              style={styles.helpOverlay}
              onPress={() => setStreakHelpVisible(false)}
            />
            <View style={styles.helpOverlayContent} pointerEvents="box-none">
              <Pressable style={styles.helpCard} onPress={() => {}}>
                <Text style={styles.helpTitle}>How Streaks Work</Text>
                <Text style={styles.helpBody}>
                  Post a FitPic every day to build your streak. Miss a day and your current streak resets.
                </Text>
                <TouchableOpacity
                  style={styles.helpButton}
                  onPress={() => setStreakHelpVisible(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.helpButtonText}>Got it</Text>
                </TouchableOpacity>
              </Pressable>
            </View>
          </View>
        )}
      </GestureHandlerRootView>
    </Modal>
    </>
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
  helpIconButton: {
    marginLeft: 6,
    marginTop: 2,
    padding: 4,
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
  dayCellDayLabelFuture: {
    position: "absolute",
    top: 4,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 10,
    color: "#9CA3AF",
    opacity: 0.85,
  },
  dayCellMissed: {
    backgroundColor: "#E5E7EB",
  },
  dayCellDayLabelMissed: {
    position: "absolute",
    top: 4,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 10,
    color: "#6B7280",
  },
  dayCellWithFitPic: {
    backgroundColor: "#e5e5e5",
    overflow: "hidden",
  },
  dayCellImage: {
    width: "100%",
    height: "100%",
    borderRadius: 4,
  },
  dayCellImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#FF6B35",
    borderRadius: 4,
  },
  dayCellCountBubble: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.65)",
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    elevation: 10,
  },
  dayCellCountBubbleText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#fff",
  },
  helpOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  helpOverlayContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  helpCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 24,
    maxWidth: 340,
  },
  pickerCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 24,
    maxWidth: 320,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#11181C",
    marginBottom: 12,
    textAlign: "center",
  },
  pickerOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e5e5",
    gap: 12,
  },
  pickerOptionThumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  pickerOptionThumbPlaceholder: {
    backgroundColor: "#E5E7EB",
  },
  pickerOptionTime: {
    fontSize: 15,
    color: "#11181C",
  },
  pickerCancel: {
    paddingVertical: 14,
    marginTop: 8,
    alignItems: "center",
  },
  pickerCancelText: {
    fontSize: 16,
    color: "#666A70",
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#11181C",
    marginBottom: 12,
    textAlign: "center",
  },
  helpBody: {
    fontSize: 15,
    color: "#666A70",
    lineHeight: 22,
    marginBottom: 20,
    textAlign: "center",
  },
  helpButton: {
    backgroundColor: "#11181C",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  helpButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
