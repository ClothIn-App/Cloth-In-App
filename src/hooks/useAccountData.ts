import { useCallback, useEffect, useRef, useState } from "react";
import { getCounts, getMe, getTabs } from "../services/endpoints/profile";
import { callApiEndpoint } from "../services/http";
import type {
    AccountData,
    ProfileCounts,
    ProfileMe,
    ProfileTabs,
} from "../types/account";

export function useAccountData() {
  const [data, setData] = useState<AccountData>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown>(null);

  // Track latest request to avoid setting state after unmount
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const myRequestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    const controller = new AbortController();

    try {
      const [me, counts, tabs] = await Promise.all([
        callApiEndpoint<typeof getMe extends { mock: any } ? unknown : never, ProfileMe>(getMe, {
          signal: controller.signal,
        }),
        callApiEndpoint<typeof getCounts extends { mock: any } ? unknown : never, ProfileCounts>(getCounts, {
          signal: controller.signal,
        }),
        callApiEndpoint<typeof getTabs extends { mock: any } ? unknown : never, ProfileTabs>(getTabs, {
          signal: controller.signal,
        }),
      ]);

      if (requestIdRef.current === myRequestId) {
        setData({ me, counts, tabs });
      }
    } catch (e) {
      if (requestIdRef.current === myRequestId) setError(e);
    } finally {
      if (requestIdRef.current === myRequestId) setLoading(false);
    }

    return () => controller.abort();
  }, []);

useEffect(() => {
  void load(); // fire and forget
}, [load]);


  return {
    data,
    loading,
    error,
    refetch: load,
  };
}

export default useAccountData;
