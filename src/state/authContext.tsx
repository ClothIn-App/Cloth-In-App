/*current user info - tells algos "who"*/
import React, { createContext, useContext } from "react";

type Auth = {
  userId: string;
  followingIds: string[];
};

const AuthContext = createContext<Auth>({
  userId: "u1",
  followingIds: ["u2", "u3"],
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Later: replace with real auth state
  const value: Auth = {
    userId: "u1",
    followingIds: ["u2", "u3"],
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
