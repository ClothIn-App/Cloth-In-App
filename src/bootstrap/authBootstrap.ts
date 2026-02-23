// src/bootstrap/authBootstrap.ts
import { setAuthTokenProvider } from '@/src/services/http';
import { getValidIdToken } from '@/src/services/authTokenManager';

setAuthTokenProvider(async () => {
  return await getValidIdToken(); // Returns fresh token or null, refreshes if needed
});
