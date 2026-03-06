import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { isLoggedIn as isMockLoggedIn } from "@/src/services/mockSessionUsers";
import { clearTokens, getValidIdToken } from '@/src/services/authTokenManager';
import { authEvents } from '@/src/services/authEvents';
import { userApiClient } from "@/src/services/apiClients/userClient";

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

export default function Index() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const apiMode = process.env.EXPO_PUBLIC_API_MODE || "mock";
        
        if (apiMode === "real") {
          // Real mode guard: token alone is not enough.
          // A stale token can survive while the backing user profile doc is missing,
          // which causes account/profile screens to fail-load and traps the app.
          const token = await getValidIdToken();
          if (token) {
            const uid = decodeUidFromToken(token);
            if (!uid) {
              await clearTokens();
              router.replace("/auth/welcome");
              return;
            }

            const userResponse = await userApiClient.getUser(uid);
            if (!userResponse.user) {
              await clearTokens();
              router.replace("/auth/welcome");
              return;
            }

            router.replace("/(tabs)/home");
          } else {
            router.replace("/auth/welcome");
          }
        } else {
          // Mock mode: use existing mock session check
          if (isMockLoggedIn()) {
            router.replace("/(tabs)/home");
          } else {
            router.replace("/auth/welcome");
          }
        }
      } catch (error) {
        // If auth check fails, default to welcome screen
        console.error('[INDEX:AUTH_CHECK_ERROR]', error);
        router.replace("/auth/welcome");
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();

    // Listen for token expiration events
    const unsubscribe = authEvents.on('token_expired', () => {
      router.replace("/auth/welcome");
    });

    // Cleanup listener on unmount
    return () => {
      unsubscribe();
    };
  }, [router]);

  return null;
}