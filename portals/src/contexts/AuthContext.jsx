import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as authService from "../services/authService";
import * as inventoryService from "../services/inventoryService";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { queryKeys, STALE_HOTEL_MS } from "../lib/queryKeys";

const AuthContext = createContext(null);

function isHotelUser(user) {
  return user?.role === "HOTEL_PROVIDER" || user?.providerType === "hotel";
}

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useLocalStorage("pagume_auth_session", null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [avatarOverride, setAvatarOverride] = useState(null);

  const user = session?.user ?? null;
  const isHotel = Boolean(session?.token && isHotelUser(user));

  const hotelsQuery = useQuery({
    queryKey: queryKeys.hotels,
    queryFn: () => inventoryService.getHotels(),
    staleTime: STALE_HOTEL_MS,
    enabled: isHotel,
  });

  const hotelProfilePicture = hotelsQuery.data?.[0]?.profilePicture || null;

  const avatarUrl =
    avatarOverride !== null
      ? avatarOverride || null
      : hotelProfilePicture || session?.avatarUrl || null;

  const setAvatarUrl = useCallback(
    (url) => {
      const next = url || null;
      setAvatarOverride(next);
      setSession((prev) => (prev ? { ...prev, avatarUrl: next } : prev));
    },
    [setSession]
  );

  useEffect(() => {
    if (hotelProfilePicture) {
      setAvatarOverride(null);
      setSession((prev) =>
        prev && prev.avatarUrl !== hotelProfilePicture
          ? { ...prev, avatarUrl: hotelProfilePicture }
          : prev
      );
    }
  }, [hotelProfilePicture, setSession]);

  const refreshAvatar = useCallback(async () => {
    if (!isHotel) return;
    await queryClient.invalidateQueries({ queryKey: queryKeys.hotels });
  }, [isHotel, queryClient]);

  const login = async (email, password) => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const { token, user: nextUser } = await authService.login(email, password);
      setAvatarOverride(null);
      setSession({ token, user: nextUser, avatarUrl: null });
      return nextUser;
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
    setAvatarOverride(null);
    queryClient.removeQueries({ queryKey: queryKeys.hotels });
  };

  const value = useMemo(
    () => ({
      user,
      token: session?.token ?? null,
      role: user?.role ?? null,
      isAuthenticated: Boolean(session?.token),
      isAuthenticating,
      authError,
      avatarUrl,
      setAvatarUrl,
      refreshAvatar,
      login,
      logout,
    }),
    [
      user,
      session?.token,
      isAuthenticating,
      authError,
      avatarUrl,
      setAvatarUrl,
      refreshAvatar,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
