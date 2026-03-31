import { useCallback, useEffect, useRef, useState } from 'react';
import type { ProfileMe, ProfileCounts } from '../types/account';
import { userApiClient } from '../services/apiClients/userClient';

export type OtherUserProfileData = {
  me?: ProfileMe;
  counts?: ProfileCounts;
  isFollowing: boolean;
};

export default function useOtherUserProfileData(userId: string | undefined) {
  const [data, setData] = useState<OtherUserProfileData>({ isFollowing: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const reqRef = useRef(0);

  const load = useCallback(async () => {
    const myReq = ++reqRef.current;

    if (!userId) {
      setLoading(true);
      setError(null);
      setData({ isFollowing: false });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [userRes, countsRes, followRes] = await Promise.all([
        userApiClient.getUser(userId),
        userApiClient.getProfileCounts(userId),
        userApiClient.getFollowStatus(userId),
      ]);

      if (reqRef.current !== myReq) return;

      if (!userRes.user) {
        setError(new Error(`User ${userId} not found`));
        return;
      }

      const me: ProfileMe = {
        ...userRes.user,
        displayName: userRes.user.displayName ?? userRes.user.name,
      } as ProfileMe;

      const counts: ProfileCounts = countsRes ?? (userRes.user as any).counts;

      setData({ me, counts, isFollowing: followRes.isFollowing ?? false });
    } catch (e) {
      if (reqRef.current === myReq) setError(e);
    } finally {
      if (reqRef.current === myReq) setLoading(false);
    }
  }, [userId]);

  useEffect(() => { void load(); }, [load]);

  const setIsFollowing = useCallback((value: boolean) => {
    setData((prev) => ({ ...prev, isFollowing: value }));
  }, []);

  return { data, loading, error, refetch: load, setIsFollowing };
}
