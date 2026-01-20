import { useCallback, useEffect, useRef, useState } from "react";
import type { AccountData } from "../types/account";
import usersData from "../mocks/mock-users.json";

export default function useAccountData(userId?: string) {
  const [data, setData] = useState<AccountData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const reqRef = useRef(0);

  const load = useCallback(async () => {
    const myReq = ++reqRef.current;

    // If we don't have a userId yet (e.g. auth/profile still resolving),
    // keep the caller in a loading state to avoid a flash of empty UI.
    if (!userId) {
      setLoading(true);
      setError(null);
      setData({});
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Load user from mock-users.json
      const user = (usersData as Record<string, any>)[userId];
      
      if (reqRef.current === myReq) {
        if (!user) {
          setError(new Error(`User ${userId} not found`));
          return;
        }

        // Return user object as-is
        const me = user as any;

        setData({ me });
      }
    } catch (e) {
      if (reqRef.current === myReq) setError(e);
    } finally {
      if (reqRef.current === myReq) setLoading(false);
    }
  }, [userId]);

  useEffect(() => { void load(); }, [load]);

  return { data, loading, error, refetch: load };
}
