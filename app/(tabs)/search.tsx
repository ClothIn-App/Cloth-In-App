import React from 'react';
import { StatusBar } from 'expo-status-bar';
import SearchBar from '@/components/search/search-bar';

export default function SearchScreen() {
  return (
    <>
      <StatusBar style="dark" />
      <SearchBar />
    </>
  );
}