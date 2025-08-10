/**
 * SegmentedTabs.tsx
 * A generic tab switcher component for toggling between two or more views.
 * Handles its own visual state but delegates selected value to parent via onChange.
 * Example: For You / Following switch on the Home page.
 */

import { FlatList, Image, Text, View } from "react-native";
import { Post } from "../src/types/post";

export default function PinGrid({ posts, loading }:{ posts: Post[]; loading: boolean }) {
  if (loading) {
    return (
      <FlatList
        data={[1,2,3,4,5,6]}
        keyExtractor={(x)=>String(x)}
        numColumns={2}
        contentContainerStyle={{ padding: 6 }}
        renderItem={() => <View style={{ flex:1, height:160, margin:6, borderRadius:12, backgroundColor:"#eee" }} />}
      />
    );
  }
  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      numColumns={2}
      contentContainerStyle={{ padding: 6, backgroundColor: "#f6f6f6", flexGrow: 1 }}
      renderItem={({ item }) => (
        <View style={{ flex: 1, margin: 6, backgroundColor: "#fff", borderRadius: 12, overflow: "hidden" }}>
          <Image source={{ uri: item.image }} style={{ width: "100%", height: 150 }} />
          <Text style={{ padding: 8 }}>{item.title}</Text>
        </View>
      )}
    />
  );
}
