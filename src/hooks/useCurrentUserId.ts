import { useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { getCurrentUserId as getMockCurrentUserId } from "../services/mockSessionUsers";
import { getValidIdToken } from "../services/authTokenManager";

function decodeUidFromToken(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const json = globalThis.atob ? globalThis.atob(padded) : "";
    if (!json) return null;
    const payload = JSON.parse(json) as { user_id?: string; sub?: string };
    return payload.user_id ?? payload.sub ?? null;
  } catch {
    return null;
  }
}

export function useCurrentUserId() {
  const { auth } = useAuth();
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const resolveUserId = async () => {
      const apiMode = process.env.EXPO_PUBLIC_API_MODE ?? "mock";
      if (apiMode !== "real") {
        if (!cancelled) {
          setUserId(getMockCurrentUserId());
          setLoading(false);
        }
        return;
      }

      if (auth.user?.uid) {
        if (!cancelled) {
          setUserId(auth.user.uid);
          setLoading(false);
        }
        return;
      }

      try {
        const token = await getValidIdToken();
        const uid = token ? decodeUidFromToken(token) : null;
        if (!cancelled) {
          setUserId(uid ?? undefined);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void resolveUserId();
    return () => {
      cancelled = true;
    };
  }, [auth.user?.uid]);

  return { userId, loading };
}

