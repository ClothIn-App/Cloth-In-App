import React, { createContext, ReactNode, useContext, useState } from 'react';

export type AuthUser = { uid: string; email: string; name?: string };
export type AuthState = {
  idToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
};

type Ctx = {
  auth: AuthState;
  setAuth: (next: AuthState) => void;
  clearAuth: () => void;
};

const AuthContext = createContext<Ctx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuthState] = useState<AuthState>({
    idToken: null,
    refreshToken: null,
    user: null,
  });

  const setAuth = (next: AuthState) => setAuthState(next);
  const clearAuth = () => setAuthState({ idToken: null, refreshToken: null, user: null });

  return (
    <AuthContext.Provider value={{ auth, setAuth, clearAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
