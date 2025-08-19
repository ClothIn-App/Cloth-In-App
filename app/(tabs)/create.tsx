// app/(tabs)/create.tsx
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { useCreateSheet } from "../../src/context/CreateSheetContext";

/**
 * Deep-link handler for myapp://create
 * Opens the Create sheet and immediately returns focus to a real tab.
 */
export default function CreateDeepLink() {
  const router = useRouter();
  const { open } = useCreateSheet();

  useEffect(() => {
    // open the sheet
    open();
    // bounce back to the previous screen or home so we don't "sit" on /create
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/home");
  }, []);

  return null;
}
