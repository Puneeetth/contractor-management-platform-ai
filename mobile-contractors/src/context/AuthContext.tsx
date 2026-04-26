import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { clearAuthSession, getAuthSession, saveAuthSession } from "../services/storage";
import { loginContractor, setAuthToken } from "../services/api";
import { AuthResponse, LoginPayload } from "../types/auth";

type AuthContextType = {
  session: AuthResponse | null;
  loading: boolean;
  signIn: (payload: LoginPayload) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function hydrateSession() {
      try {
        const storedSession = await getAuthSession();
        if (mounted && storedSession) {
          setAuthToken(storedSession.token);
          setSession(storedSession);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    hydrateSession();

    return () => {
      mounted = false;
    };
  }, []);

  async function signIn(payload: LoginPayload) {
    const auth = await loginContractor(payload);
    await saveAuthSession(auth);
    setSession(auth);
  }

  async function signOut() {
    setAuthToken(null);
    await clearAuthSession();
    setSession(null);
  }

  const value = useMemo(
    () => ({
      session,
      loading,
      signIn,
      signOut
    }),
    [loading, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
