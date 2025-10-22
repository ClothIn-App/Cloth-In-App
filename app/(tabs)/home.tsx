// app/tabs/index.tsx
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import MasonryGrid from "../../components/masonry-grid";

export default function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top"]}>
      <StatusBar style="dark" />

      {/* Custom Header with ClothIn title, streak, and search */}
      <View style={styles.headerContainer}>
        <Text style={styles.appTitle}>ClothIn</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.streakButton}
          >
            <Ionicons name="flame" size={24} color="#FF6B35" />
            <Text style={styles.streakNumber}>7</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => router.push('/search-modal')} 
            style={styles.searchButton}
          >
            <Ionicons name="search-outline" size={24} color="#11181C" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Masonry Grid with Mock Images */}
      <MasonryGrid />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e5e5',
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#11181C',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 4,
  },
  streakNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
  },
  searchButton: {
    padding: 8,
  },
});
