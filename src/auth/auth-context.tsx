import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import * as api from "@/lib/api-client";

type AuthState = {
  user: Record<string, unknown> | null;
  isPatient: boolean;
  hydrated: boolean;
  registerPatient: (payload: api.RegisterPatientPayload) => Promise<void>;
  requestPatientOtp: (telephone: string, pin: string) => Promise<void>;
  verifyPatientOtp: (telephone: string, pin: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await api.getAccessToken();
      if (!token) {
        setHydrated(true);
        return;
      }
      try {
        setUser(await api.fetchMe());
      } catch {
        await api.clearTokens();
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  const afterAuth = async (tokens: api.AuthTokens) => {
    await api.setTokens(tokens.accessToken, tokens.refreshToken);
    setUser(await api.fetchMe());
  };

  const value: AuthState = {
    user,
    isPatient: user?.role === "patient",
    hydrated,
    registerPatient: async (payload) => afterAuth(await api.registerPatient(payload)),
    requestPatientOtp: async (telephone, pin) => {
      await api.requestPatientOtp(telephone, pin);
    },
    verifyPatientOtp: async (telephone, pin, code) =>
      afterAuth(await api.verifyPatientOtp(telephone, pin, code)),
    logout: async () => {
      const refreshToken = await api.getRefreshToken();
      if (refreshToken) {
        try {
          await api.logoutRequest(refreshToken);
        } catch {
          // best-effort : on déconnecte localement même si l'appel réseau échoue
        }
      }
      await api.clearTokens();
      setUser(null);
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
