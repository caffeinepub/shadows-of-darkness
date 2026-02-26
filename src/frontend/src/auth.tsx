// Authorization wrapper using Internet Identity
import React, { createContext, useContext, ReactNode } from "react";
import { useInternetIdentity } from "./hooks/useInternetIdentity";

interface AuthContextValue {
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  principal: string | null;
  isLoggingIn: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
  principal: null,
  isLoggingIn: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { login, clear, loginStatus, identity } = useInternetIdentity();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";
  const principal = identity?.getPrincipal().toString() ?? null;

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: unknown) {
      const err = error as { message?: string };
      if (err.message === "User is already authenticated") {
        await clear();
        setTimeout(() => login(), 300);
      }
    }
  };

  const handleLogout = async () => {
    await clear();
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      login: handleLogin,
      logout: handleLogout,
      principal,
      isLoggingIn,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
