/**
 * Hook for calculating streaks from FitPic data
 * Groups FitPics by date and calculates current and longest streaks
 */

import { useMemo } from 'react';
import { useUserFitPics } from './useUserFitPics';
import { getCurrentUserId, getTodayLocalDate } from '../services/mockSessionUsers';
import type { FitPic } from '../types/fitpic';

export type StreakData = {
  currentStreak: number;
  longestStreak: number;
  fitpicsByDate: Map<string, FitPic[]>;
  loading: boolean;
  todayLocalDate: string;
};

/**
 * Groups FitPics by local date (YYYY-MM-DD format)
 * Uses device timezone to convert ISO dates to local dates
 */
function groupFitPicsByDate(fitpics: FitPic[]): Map<string, FitPic[]> {
  const map = new Map<string, FitPic[]>();

  fitpics.forEach((fitpic) => {
    const date = new Date(fitpic.createdAt);
    // Convert to local date string (YYYY-MM-DD)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;

    if (!map.has(dateKey)) {
      map.set(dateKey, []);
    }
    map.get(dateKey)!.push(fitpic);
  });

  return map;
}

function getDeviceTodayStr(): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

/**
 * Calculates streaks from a map of dates to FitPics, anchored to todayStr.
 */
function calculateStreaks(
  fitpicsByDate: Map<string, FitPic[]>,
  todayStr: string
): {
  currentStreak: number;
  longestStreak: number;
} {
  if (fitpicsByDate.size === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Get all dates and sort chronologically
  const dates = Array.from(fitpicsByDate.keys()).sort();

  // Calculate longest streak (all-time)
  let longestStreak = 0;
  let currentSequence = 0;
  let prevDate: Date | null = null;

  dates.forEach((dateStr) => {
    const currentDate = new Date(dateStr + 'T00:00:00');
    
    if (prevDate === null) {
      currentSequence = 1;
    } else {
      const daysDiff = Math.floor(
        (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysDiff === 1) {
        // Consecutive day
        currentSequence++;
      } else {
        // Gap found, reset sequence
        longestStreak = Math.max(longestStreak, currentSequence);
        currentSequence = 1;
      }
    }
    
    prevDate = currentDate;
  });
  
  longestStreak = Math.max(longestStreak, currentSequence);

  // Calculate current streak (from today backwards, anchored to todayStr)
  const [todayY, todayM, todayD] = todayStr.split('-').map(Number);
  let currentStreak = 0;
  let checkDate = new Date(todayY, todayM - 1, todayD);
  
  // Check if today has a FitPic
  if (fitpicsByDate.has(todayStr)) {
    currentStreak = 1;
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    checkDate.setDate(checkDate.getDate() - 1);
  }
  
  // Count backwards until we find a gap
  while (checkDate >= new Date(2025, 5, 1)) {
    const checkDateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
    
    if (fitpicsByDate.has(checkDateStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return { currentStreak, longestStreak };
}

export function useStreakData(userId?: string): StreakData {
  const currentUserId = userId || getCurrentUserId();
  const { fitpics, loading } = useUserFitPics(currentUserId);

  const streakData = useMemo(() => {
    const fitpicsByDate = groupFitPicsByDate(fitpics);
    const todayLocalDate = getTodayLocalDate() ?? getDeviceTodayStr();
    const { currentStreak, longestStreak } = calculateStreaks(
      fitpicsByDate,
      todayLocalDate
    );

    return {
      currentStreak,
      longestStreak,
      fitpicsByDate,
      loading,
      todayLocalDate,
    };
  }, [fitpics, loading]);

  return streakData;
}
