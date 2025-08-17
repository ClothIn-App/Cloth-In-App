import type { AuthState } from '../context/AuthContext';

export function getDisplayName(auth: AuthState): string {
  return auth.user?.name || auth.user?.email || 'Mock User';
}
