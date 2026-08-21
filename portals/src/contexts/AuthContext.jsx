import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as authService from "../services/authService";
import * as inventoryService from "../services/inventoryService";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { queryKeys, STALE_HOTEL_MS, STALE_PROFILE_MS } from "../lib/queryKeys";

const AuthContext = createContext(null);

function isHotelUser(user) {
  return user?.role === "HOTEL_PROVIDER" || user?.providerType === "hotel";
}

function isAgencyUser(user) {
  return user?.role === "TOUR_AGENCY" || user?.providerType === "agency";
}

function isCarRentalUser(user) {
  return user?.role === "CAR_RENTAL" || user?.providerType === "transport";
}

/** Only treat non-empty strings as a real uploaded avatar. */
function cleanAvatarUrl(url) {
  if (typeof url !== "string") return null;
  const trimmed = url.trim();
  return trimmed || null;
}

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useLocalStorage("pagume_auth_session", null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState(null);
  /**
   * undefined = use live API source for this user
   * null = explicitly no picture (show default)
   * string = optimistic uploaded URL
   */
  const [avatarOverride, setAvatarOverride] = useState(undefined);

  const user = session?.user ?? null;
  const userId = user?.id ?? null;
  const isHotel = Boolean(session?.token && isHotelUser(user));
  const isAgency = Boolean(session?.token && isAgencyUser(user));
  const isCarRental = Boolean(session?.token && isCarRentalUser(user));
  const usesBusinessLogo = isAgency || isCarRental;

  const hotelsQuery = useQuery({
    queryKey: [...queryKeys.hotels, userId],
    queryFn: () => inventoryService.getHotels(),
    staleTime: STALE_HOTEL_MS,
    enabled: Boolean(isHotel && userId),
  });

  const profileQuery = useQuery({
    queryKey: [...queryKeys.profile, userId],
    queryFn: () => inventoryService.getProviderProfile(),
    staleTime: STALE_PROFILE_MS,
    enabled: Boolean(usesBusinessLogo && userId),
  });

  // Only the current role's uploaded picture — never another account's cached image.
  const liveAvatar = isHotel
    ? cleanAvatarUrl(hotelsQuery.data?.[0]?.profilePicture)
    : usesBusinessLogo
      ? cleanAvatarUrl(profileQuery.data?.logo)
      : null;

  const avatarUrl = avatarOverride !== undefined ? avatarOverride : liveAvatar;

  const setAvatarUrl = useCallback(
    (url) => {
      const next = cleanAvatarUrl(url);
      setAvatarOverride(next);
      setSession((prev) => {
        if (!prev) return prev;
        if ((prev.avatarUrl || null) === next) return prev;
        return { ...prev, avatarUrl: next };
      });
    },
    [setSession]
  );

  // Reset avatar override whenever the logged-in user changes.
  useEffect(() => {
    setAvatarOverride(undefined);
    setSession((prev) => {
      if (!prev) return prev;
      if (prev.avatarUrl == null) return prev;
      return { ...prev, avatarUrl: null };
    });
  }, [userId, setSession]);

  // Keep session.avatarUrl aligned with live data once it loads (optional persistence).
  useEffect(() => {
    if (!userId) return;
    if (isHotel && hotelsQuery.isLoading) return;
    if (usesBusinessLogo && profileQuery.isLoading) return;
    if (avatarOverride !== undefined) return;

    setSession((prev) => {
      if (!prev) return prev;
      if ((prev.avatarUrl || null) === liveAvatar) return prev;
      return { ...prev, avatarUrl: liveAvatar };
    });
  }, [
    userId,
    liveAvatar,
    avatarOverride,
    isHotel,
    usesBusinessLogo,
    hotelsQuery.isLoading,
    profileQuery.isLoading,
    setSession,
  ]);

  const refreshAvatar = useCallback(async () => {
    if (isHotel) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.hotels });
    }
    if (usesBusinessLogo) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile });
    }
  }, [isHotel, usesBusinessLogo, queryClient]);

  const login = async (email, password) => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const { token, user: nextUser } = await authService.login(email, password);
      setAvatarOverride(undefined);
      queryClient.removeQueries({ queryKey: ["provider"] });
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
    setAvatarOverride(undefined);
    queryClient.removeQueries({ queryKey: ["provider"] });
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
