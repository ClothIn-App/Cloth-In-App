import { useRouter } from "expo-router";
import { useEffect } from "react";
import { isLoggedIn } from "@/src/services/mockSessionUsers";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    if (isLoggedIn()) {
      router.replace("/(tabs)/home");
    } else {
      router.replace("/auth/welcome");
    }
  }, []);

  return null;
}