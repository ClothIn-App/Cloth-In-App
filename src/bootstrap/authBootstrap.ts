// src/bootstrap/authBootstrap.ts
import * as SecureStore from 'expo-secure-store';
import { setAuthTokenProvider } from '@/src/services/http';

setAuthTokenProvider(async () => {
  return await SecureStore.getItemAsync('idToken'); // null if missing
});
