import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
<<<<<<< HEAD
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
=======
import {
  ActivityIndicator,
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { authApiClient, userApiClient } from "@/src/services/apiClients";
import {
  clearRealCurrentUser,
  isLoggedIn as isMockLoggedIn,
  mapGetUserResponseToRawUser,
  setRealCurrentUser,
} from "@/src/services/mockSessionUsers";
import { getValidIdToken, clearTokens } from "@/src/services/authTokenManager";
import { authEvents } from "@/src/services/authEvents";

const bgPattern = require("../assets/images/login-bg.png");
>>>>>>> main

export default function Index() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const apiMode = process.env.EXPO_PUBLIC_API_MODE || "mock";

        if (apiMode === "real") {
<<<<<<< HEAD
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
=======
          const token = await getValidIdToken();
          if (!token) {
>>>>>>> main
            router.replace("/auth/welcome");
            return;
          }
          const userId = await authApiClient.getMe();
          if (!userId) {
            await clearTokens();
            clearRealCurrentUser();
            router.replace("/auth/welcome");
            return;
          }
          try {
            const userRes = await userApiClient.getUser(userId);
            const rawUser = userRes?.user
              ? mapGetUserResponseToRawUser(userRes.user, userId)
              : undefined;
            setRealCurrentUser(userId, rawUser ?? undefined);
          } catch {
            setRealCurrentUser(userId);
          }
          router.replace("/(tabs)/home");
        } else {
          if (isMockLoggedIn()) {
            router.replace("/(tabs)/home");
          } else {
            router.replace("/auth/welcome");
          }
        }
      } catch (error) {
        console.error("[INDEX:AUTH_CHECK_ERROR]", error);
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

  return (
    <ImageBackground
      source={bgPattern}
      resizeMode="repeat"
      style={styles.background}
      imageStyle={{ opacity: 0.07 }}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Clōth-In</Text>
        <ActivityIndicator size="large" style={styles.spinner} color="#000" />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#000",
  },
  spinner: {
    marginTop: 24,
  },
});