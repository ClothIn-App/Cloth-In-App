import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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

export default function Index() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const apiMode = process.env.EXPO_PUBLIC_API_MODE || "mock";

        if (apiMode === "real") {
          const token = await getValidIdToken();
          if (!token) {
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