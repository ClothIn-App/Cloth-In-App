import React, { useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { FITPIC_ASSETS } from '../../src/maps/images';
import type { FitPic } from '../../src/types/fitpic';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const WEEKDAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

type MonthData = {
  id: string;
  year: number;
  month: number;
  days: DayData[];
};

type DayData = {
  date?: Date;
  dateKey: string;
  fitpics: FitPic[];
  placeholder?: boolean;
};

type Props = {
  fitpicsByDate: Map<string, FitPic[]>;
  todayLocalDate: string;
  visible?: boolean;
  onDayPress: (fitpic: FitPic) => void;
  contentWidth?: number;
};

export default function StreakCalendar({
  fitpicsByDate,
  todayLocalDate,
  visible = true,
  onDayPress,
  contentWidth,
}: Props) {
  const flatListRef = useRef<FlatList>(null);
  const effectiveWidth = contentWidth ?? (SCREEN_WIDTH - 32);
  const daySize = (effectiveWidth - 6 * 6) / 7; // 6 gaps of 6px between 7 columns (matches gap: 6)

  const months = useMemo(() => {
    const monthsList: MonthData[] = [];
    const startDate = new Date(2025, 5, 1); // June 2025
    const [endY, endM] = todayLocalDate.split('-').map(Number);
    const endDate = new Date(endY, endM - 1, 1); // First day of month containing today

    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const firstDayOfWeek = firstDay.getDay();
      const numDays = lastDay.getDate();

      const days: DayData[] = [];
      for (let i = 0; i < firstDayOfWeek; i++) {
        days.push({ dateKey: `empty-${year}-${month}-${i}`, fitpics: [], placeholder: true });
      }
      for (let day = 1; day <= numDays; day++) {
        const date = new Date(year, month, day);
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const fitpics = fitpicsByDate.get(dateKey) || [];
        days.push({ date, dateKey, fitpics });
      }
      const totalSoFar = firstDayOfWeek + numDays;
      const numTrailing = (7 - (totalSoFar % 7)) % 7;
      for (let i = 0; i < numTrailing; i++) {
        days.push({ dateKey: `trail-${year}-${month}-${i}`, fitpics: [], placeholder: true });
      }

      monthsList.push({
        id: `${year}-${month}`,
        year,
        month,
        days,
      });

      currentDate = new Date(year, month + 1, 1);
    }

    return monthsList; // Chronological: oldest first, current month last
  }, [fitpicsByDate, todayLocalDate]);

  const renderDay = (day: DayData) => {
    if (day.placeholder) {
      return (
        <View
          key={day.dateKey}
          style={[styles.daySquarePlaceholder, { width: daySize, height: daySize }]}
        />
      );
    }
    const hasFitPic = day.fitpics.length > 0;
    const firstFitpic = day.fitpics[0];
    const imageSource = firstFitpic ? FITPIC_ASSETS[firstFitpic.id] : null;
    const isMissedPast = !hasFitPic && day.dateKey < todayLocalDate;
    const emptyDayStyle = isMissedPast ? styles.dayMissed : styles.dayEmpty;
    const emptyNumberStyle = isMissedPast ? styles.dayNumberMissed : styles.dayNumber;
    const date = day.date!;

    return (
      <TouchableOpacity
        key={day.dateKey}
        style={[
          styles.daySquare,
          { width: daySize, height: daySize },
          !hasFitPic && emptyDayStyle,
        ]}
        onPress={() => {
          if (hasFitPic && firstFitpic) {
            onDayPress(firstFitpic);
          }
        }}
        disabled={!hasFitPic}
        activeOpacity={0.7}
      >
        {hasFitPic && imageSource ? (
          <>
            <Image
              source={imageSource}
              style={styles.dayImage}
              contentFit="cover"
            />
            {day.fitpics.length > 1 && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{day.fitpics.length}</Text>
              </View>
            )}
          </>
        ) : (
          <Text style={emptyNumberStyle}>{date.getDate()}</Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderMonth = ({ item }: { item: MonthData }) => {
    return (
      <View style={styles.monthContainer}>
        <Text style={styles.monthHeader}>
          {MONTH_NAMES[item.month]} {item.year}
        </Text>
        <View style={styles.weekdayRow}>
          {WEEKDAY_HEADERS.map((day, index) => (
            <View
              key={index}
              style={[styles.weekdayHeader, { width: daySize }]}
            >
              <Text style={styles.weekdayText}>{day}</Text>
            </View>
          ))}
        </View>
        <View style={styles.daysGrid}>
          {item.days.map((day) => renderDay(day))}
        </View>
      </View>
    );
  };

  const getItemLayout = (_: any, index: number) => {
    // Estimate: each month is roughly 200-300px tall depending on weeks
    const estimatedMonthHeight = 280;
    return {
      length: estimatedMonthHeight,
      offset: estimatedMonthHeight * index,
      index,
    };
  };

  // Scroll to bottom (most recent month) when drawer becomes visible and data is ready
  useEffect(() => {
    if (!visible || months.length === 0 || !flatListRef.current) return;
    const t = setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: false });
    }, 120);
    return () => clearTimeout(t);
  }, [visible, months.length]);

  return (
    <FlatList
      ref={flatListRef}
      data={months}
      renderItem={renderMonth}
      keyExtractor={(item) => item.id}
      getItemLayout={getItemLayout}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.container}
      onScrollToIndexFailed={(info) => {
        setTimeout(() => {
          flatListRef.current?.scrollToOffset({
            offset: info.averageItemLength * info.index,
            animated: false,
          });
        }, 100);
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  monthContainer: {
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  monthHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#11181C',
    marginBottom: 16,
  },
  weekdayRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  weekdayHeader: {
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666A70',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  daySquare: {
    borderRadius: 4,
    backgroundColor: '#F7F7F8',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  daySquarePlaceholder: {
    borderRadius: 4,
  },
  dayEmpty: {
    backgroundColor: '#FFFFFF',
  },
  dayMissed: {
    backgroundColor: '#E8E8E8',
  },
  dayImage: {
    width: '100%',
    height: '100%',
  },
  dayNumber: {
    fontSize: 14,
    color: '#11181C',
  },
  dayNumberMissed: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  countBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
});
