import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { isLoggedIn as isMockLoggedIn } from "@/src/services/mockSessionUsers";
import { getValidIdToken, clearTokens } from '@/src/services/authTokenManager';
import { authEvents } from '@/src/services/authEvents';

export default function Index() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // TEMPORARY: Force clear tokens to break the loop and allow testing
        // TODO: Remove this after testing the "Clear Auth State" button works
        await clearTokens();
        
        const apiMode = process.env.EXPO_PUBLIC_API_MODE || "mock";
        
        if (apiMode === "real") {
          // Real API mode: use token manager to get valid token (refreshes if needed)
          const token = await getValidIdToken();
          if (token) {
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