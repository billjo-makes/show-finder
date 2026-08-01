import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { AuthResponse, AuthUser, ProfileDTO } from "@show-finder/shared";
import {
  fetchMe,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  updateCountry as updateCountryRequest,
} from "../api/auth";
import { selectProfile } from "../api/profiles";

interface AuthContextValue {
  user: AuthUser | null;
  activeProfile: ProfileDTO | null;
  profiles: ProfileDTO[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (email: string, password: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  switchProfile: (profileId: string) => Promise<void>;
  refreshProfiles: () => Promise<void>;
  updateCountry: (country: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [activeProfile, setActiveProfile] = useState<ProfileDTO | null>(null);
  const [profiles, setProfiles] = useState<ProfileDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMe()
      .then((res) => {
        setUser(res.user);
        setActiveProfile(res.activeProfile);
        setProfiles(res.profiles);
      })
      .catch(() => {
        setUser(null);
        setActiveProfile(null);
        setProfiles([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const res = await loginRequest(email, password);
    setUser(res.user);
    setActiveProfile(res.activeProfile);
    setProfiles(res.profiles);
    return res;
  }

  async function register(email: string, password: string) {
    const res = await registerRequest(email, password);
    setUser(res.user);
    setActiveProfile(res.activeProfile);
    setProfiles(res.profiles);
    return res;
  }

  async function logout() {
    await logoutRequest();
    setUser(null);
    setActiveProfile(null);
    setProfiles([]);
  }

  async function switchProfile(profileId: string) {
    const res = await selectProfile(profileId);
    setActiveProfile(res.activeProfile);
  }

  async function refreshProfiles() {
    const res = await fetchMe();
    setUser(res.user);
    setActiveProfile(res.activeProfile);
    setProfiles(res.profiles);
  }

  async function updateCountry(country: string) {
    const res = await updateCountryRequest(country);
    setUser(res.user);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        activeProfile,
        profiles,
        isLoading,
        login,
        register,
        logout,
        switchProfile,
        refreshProfiles,
        updateCountry,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
