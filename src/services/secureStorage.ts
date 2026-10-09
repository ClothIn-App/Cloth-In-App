// src/services/secureStorage.ts
// Native: keychain-backed storage via expo-secure-store.
// The web build uses secureStorage.web.ts instead.
export { getItemAsync, setItemAsync, deleteItemAsync } from 'expo-secure-store';
