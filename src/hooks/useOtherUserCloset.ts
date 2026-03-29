import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { userApiClient } from '../services/apiClients/userClient';
import { normalizeClosetFromUser, type NormalizedCloset } from '../types/closet';

export type UseOtherUserClosetOptions = {
  /**
   * Seed from `useOtherUserProfileData` → `me.closet` so the Closet tab can paint before
   * this hook’s `getUser` returns. Parent `refetch()` on focus keeps `me` fresh; the hook
   * still fetches for a dedicated error/retry path and to pick up closet if profile payload lagged.
   */
  initialCloset?: unknown;
};

export function useOtherUserCloset(userId: string | undefined, options?: UseOtherUserClosetOptions) {
  const { initialCloset } = options ?? {};
  const reqRef = useRef(0);
  const [hasServerResult, setHasServerResult] = useState(false);
  const [serverClosetRaw, setServerClosetRaw] = useState<unknown>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setHasServerResult(false);
      setServerClosetRaw(undefined);
      setError(null);
      return;
    }

    const myReq = ++reqRef.current;
    setLoading(true);
    setError(null);

    try {
      const res = await userApiClient.getUser(userId);
      if (reqRef.current !== myReq) return;

      if (!res.user) {
        setError(new Error(`User ${userId} not found`));
        setHasServerResult(false);
        return;
      }

      setServerClosetRaw(res.user.closet);
      setHasServerResult(true);
    } catch (e) {
      if (reqRef.current === myReq) {
        setError(e);
        setHasServerResult(false);
      }
    } finally {
      if (reqRef.current === myReq) {
        setLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    setHasServerResult(false);
    setServerClosetRaw(undefined);
    setError(null);
    void load();
  }, [userId, load]);

  const closetData: NormalizedCloset = useMemo(() => {
    const raw = hasServerResult ? serverClosetRaw : initialCloset;
    return normalizeClosetFromUser(raw);
  }, [hasServerResult, serverClosetRaw, initialCloset]);

  const refetch = useCallback(() => {
    void load();
  }, [load]);

  const showInitialLoader =
    loading && !hasServerResult && initialCloset === undefined;

  return {
    closetData,
    loading,
    error,
    refetch,
    /** True when we should show full-screen loading (no profile closet seed). */
    showInitialLoader,
    /** Last getUser for closet succeeded (vs using only `initialCloset`). */
    hasServerResult,
  };
}
