// src/services/secureStorage.web.ts
// expo-secure-store has no web implementation, so the web build keeps auth
// tokens in localStorage. Same async API as the native module.

function storage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export async function getItemAsync(key: string): Promise<string | null> {
  return storage()?.getItem(key) ?? null;
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  storage()?.setItem(key, value);
}

export async function deleteItemAsync(key: string): Promise<void> {
  storage()?.removeItem(key);
}
