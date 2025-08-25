import { useCallback, useEffect, useRef, useState } from "react";
import { userClient } from "../services/apiClients";
import type { AccountData, ProfileCounts, ProfileMe } from "../types/account";

export default function useAccountData(userId: string) {
  const [data, setData] = useState<AccountData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const reqRef = useRef(0);

  const load = useCallback(async () => {
    const myReq = ++reqRef.current;
    setLoading(true);
    setError(null);

    try {
      const res = await userClient.getUser(userId);
      if (reqRef.current === myReq) {
        const me: ProfileMe = {
          uid: res.user.uid,
          displayName: res.user.displayName ?? undefined,
          username: res.user.username ?? "username",
          avatarUrl: res.user.avatarUrl ?? undefined,
          bio: res.user.bio ?? undefined,
          accountType: (res.user as any).accountType,
        };
        const counts: ProfileCounts | undefined = res.user.counts
          ? {
              posts: res.user.counts.posts,
              following: res.user.counts.following,
              followers: res.user.counts.followers,
            }
          : undefined;

        setData({ me, counts });
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
