import React from "react";
import { View } from "react-native";
import { useThemeColor } from "../../hooks/useThemeColor";
import { ThemedText } from "../ThemedText";

type Props = { activeKey: string };

const messages: Record<string, { title: string; subtitle?: string }> = {
  fitpics:  { title: "No FitPics yet",   subtitle: "Post your first fit to see it here." },
  closet:   { title: "Closet is empty",  subtitle: "Add items to your closet to manage them here." },
  products: { title: "No products",      subtitle: "Save products you love to see them here." },
  saved:    { title: "No saved posts",   subtitle: "Save posts to view them here." },
  tagged:   { title: "No tagged posts",  subtitle: "Posts you’re tagged in will show here." },
};

export default function TabContent({ activeKey }: Props) {
  const msg = messages[activeKey] ?? { title: "Nothing here (yet)" };
  const border = useThemeColor({}, "border");
  const muted = useThemeColor({}, "mutedText");

  return (
    <View
      style={{
        flex: 1,
        margin: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: border,
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <ThemedText style={{ fontSize: 16, fontWeight: "600", marginBottom: 4 }}>
        {msg.title}
      </ThemedText>
      {msg.subtitle ? (
        <ThemedText style={{ color: muted, textAlign: "center" }}>
          {msg.subtitle}
        </ThemedText>
      ) : null}
    </View>
  );
}
