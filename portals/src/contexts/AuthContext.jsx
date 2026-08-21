import { createContext, useContext, useMemo, useState } from "react";
import * as authService from "../services/authService";
import { useLocalStorage } from "../hooks/useLocalStorage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useLocalStorage("pagume_auth_session", null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState(null);

  const login = async (email, password) => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const { token, user } = await authService.login(email, password);
      setSession({ token, user });
      return user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logout = async () => {
    await authService.logout();
    setSession(null);
  };

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      role: session?.user?.role ?? null,
      isAuthenticated: Boolean(session?.token),
      isAuthenticating,
      authError,
      login,
      logout,
    }),
    [session, isAuthenticating, authError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

