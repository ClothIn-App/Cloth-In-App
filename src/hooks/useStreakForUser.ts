import { useCallback, useEffect, useState } from "react";
import { fitpicClient } from "../services/apiClients/fitpicClient";
import { computeStreakStats } from "../utils/streakUtils";

/**
 * Returns current streak and hasPostedToday for a user (own profile or viewed profile).
 * Used to display the streak badge on ProfileHeader and PublicProfileHeader.
 */
export default function useStreakForUser(userId: string | undefined) {
  const [currentStreak, setCurrentStreak] = useState(0);
  const [hasPostedToday, setHasPostedToday] = useState(false);

  const load = useCallback(async () => {
    if (!userId) {
      setCurrentStreak(0);
      setHasPostedToday(false);
      return;
    }
    try {
      const res = await fitpicClient.listByUser(userId, undefined, 200);
      if (!res.success || !res.fitpics) {
        setCurrentStreak(0);
        setHasPostedToday(false);
        return;
      }
      const byDate: Record<string, unknown> = {};
      for (const fp of res.fitpics) {
        const d = new Date(fp.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        byDate[key] = true;
      }
      const { currentStreak: streak, hasPostedToday: postedToday } = computeStreakStats(
        Object.keys(byDate)
      );
      setCurrentStreak(streak);
      setHasPostedToday(postedToday);
    } catch {
      setCurrentStreak(0);
      setHasPostedToday(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { currentStreak, hasPostedToday };
}
