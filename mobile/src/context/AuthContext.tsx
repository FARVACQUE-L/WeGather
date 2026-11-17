import * as SecureStore from "expo-secure-store";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { ApiError, api, setAuthToken, setUnauthorizedHandler } from "@/lib/api";

const TOKEN_KEY = "auth_token";

export type User = {
  id: number;
  username: string;
  email: string;
  plan: string;
};

type AuthContextValue = {
  user: User | null;
  token: string | null;
  isRestoring: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  const logout = useCallback(async () => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
    });
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // Au démarrage : reprend le token enregistré et vérifie qu'il est valide.
  useEffect(() => {
    const restore = async () => {
      try {
        const saved = await SecureStore.getItemAsync(TOKEN_KEY);
        if (!saved) return;

        setAuthToken(saved);
        const me = await api<User>("/api/auth/authVerif");
        setToken(saved);
        setUser(me);
      } catch (error) {
        // Hors connexion, le token reste enregistré pour le prochain
        // lancement. Un refus du serveur (401, compte suspendu…) le supprime.
        if (error instanceof ApiError && error.status !== 0) {
          await logout();
        } else {
          setAuthToken(null);
        }
      } finally {
        setIsRestoring(false);
      }
    };

    restore();
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api<{ token: string }>("/api/login", {
      method: "POST",
      body: { email, password },
    });

    setAuthToken(result.token);
    const me = await api<User>("/api/auth/authVerif");
    await SecureStore.setItemAsync(TOKEN_KEY, result.token);
    setToken(result.token);
    setUser(me);
  }, []);

  const value = useMemo(
    () => ({ user, token, isRestoring, login, logout }),
    [user, token, isRestoring, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  }
  return context;
};
