import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StreakModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function StreakModal({ visible, onClose }: StreakModalProps) {
  // Mock streak data - in a real app, this would come from your backend
  const currentStreak = 7;
  const longestStreak = 15;
  const totalFitPics = 42;
  
  // Mock calendar data - showing last 30 days
  const calendarDays = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    const hasFitPic = Math.random() > 0.3; // 70% chance of having a fitpic
    return {
      date,
      hasFitPic,
    };
  });

  const getMotivationalMessage = (streak: number) => {
    if (streak === 0) return "Start your streak today! 🔥";
    if (streak < 3) return "Great start! Keep it going! 💪";
    if (streak < 7) return "You're building momentum! 🚀";
    if (streak < 14) return "Amazing consistency! ⭐";
    if (streak < 30) return "You're on fire! 🔥🔥🔥";
    return "Legendary streak! 🏆";
  };

  const renderCalendarDay = (day: { date: Date; hasFitPic: boolean }, index: number) => (
    <View
      key={index}
      style={[
        styles.calendarDay,
        day.hasFitPic && styles.calendarDayActive,
      ]}
    >
      <Text style={[
        styles.calendarDayText,
        day.hasFitPic && styles.calendarDayTextActive,
      ]}>
        {day.date.getDate()}
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#11181C" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Streak Display */}
          <View style={styles.streakDisplay}>
            <View style={styles.streakIconContainer}>
              <Ionicons name="flame" size={48} color="#FF6B35" />
            </View>
            <Text style={styles.streakNumber}>{currentStreak}</Text>
            <Text style={styles.streakLabel}>Day Streak</Text>
            <Text style={styles.motivationalMessage}>
              {getMotivationalMessage(currentStreak)}
            </Text>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{longestStreak}</Text>
              <Text style={styles.statLabel}>Longest Streak</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalFitPics}</Text>
              <Text style={styles.statLabel}>Total FitPics</Text>
            </View>
          </View>

          {/* Calendar */}
          <View style={styles.calendarSection}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <View style={styles.calendar}>
              {calendarDays.map(renderCalendarDay)}
            </View>
            <View style={styles.calendarLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.legendDotActive]} />
                <Text style={styles.legendText}>Posted FitPic</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.legendDotInactive]} />
                <Text style={styles.legendText}>No FitPic</Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.shareButton}>
              <Ionicons name="share-outline" size={20} color="#FFFFFF" />
              <Text style={styles.shareButtonText}>Share Streak</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  streakDisplay: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  streakIconContainer: {
    marginBottom: 16,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FF6B35',
    marginBottom: 8,
  },
  streakLabel: {
    fontSize: 18,
    fontWeight: '500',
    color: '#666A70',
    marginBottom: 16,
  },
  motivationalMessage: {
    fontSize: 16,
    fontWeight: '500',
    color: '#11181C',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: '#E3E3E7',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#11181C',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666A70',
  },
  calendarSection: {
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: '#E3E3E7',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#11181C',
    marginBottom: 16,
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  calendarDay: {
    width: '12%',
    aspectRatio: 1,
    marginBottom: 8,
    borderRadius: 6,
    backgroundColor: '#F7F7F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDayActive: {
    backgroundColor: '#FF6B35',
  },
  calendarDayText: {
    fontSize: 12,
    color: '#666A70',
  },
  calendarDayTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendDotActive: {
    backgroundColor: '#FF6B35',
  },
  legendDotInactive: {
    backgroundColor: '#F7F7F8',
  },
  legendText: {
    fontSize: 14,
    color: '#666A70',
  },
  actionsContainer: {
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: '#E3E3E7',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
