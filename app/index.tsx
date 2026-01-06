import { useRouter } from "expo-router";
import { useEffect } from "react";
import mockSession from "@/src/mocks/mock-session.json";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    if (mockSession.isLoggedIn === true) {
      router.replace("/(tabs)/home");
    } else {
      router.replace("/auth/welcome");
    }
  }, []);

  return null;
}