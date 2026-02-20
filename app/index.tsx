import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { isLoggedIn as isMockLoggedIn } from "@/src/services/mockSessionUsers";

export default function Index() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const apiMode = process.env.EXPO_PUBLIC_API_MODE || "mock";
      
      if (apiMode === "real") {
        // Real API mode: check SecureStore for token
        const token = await SecureStore.getItemAsync("idToken");
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
      
      setIsChecking(false);
    };

    checkAuth();
  }, []);

  return null;
}