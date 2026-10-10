import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AuthSessionResponse, PlayerProfile } from "@dotwars/shared";
import { getApiUrl } from "../game/apiUrl";

const TOKEN_KEY = "dotwars.session";
const STUB_ADDRESS_KEY = "dotwars.stubAddress";

interface WalletAuthValue {
  player: PlayerProfile | null;
  token: string | null;
  ready: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => void;
}

const WalletAuthContext = createContext<WalletAuthValue>({
  player: null,
  token: null,
  ready: false,
  error: null,
  login: async () => undefined,
  logout: () => undefined,
});

export function useWalletAuth() {
  return useContext(WalletAuthContext);
}

async function readJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { message?: string | string[] };
  if (!response.ok) {
    const message = Array.isArray(data.message) ? data.message[0] : data.message;
    throw new Error(message || "Auth failed");
  }
  return data;
}

export function WalletAuthProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applySession = useCallback((session: AuthSessionResponse) => {
    localStorage.setItem(TOKEN_KEY, session.token);
    localStorage.setItem(STUB_ADDRESS_KEY, session.player.address);
    setToken(session.token);
    setPlayer(session.player);
    setError(null);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setPlayer(null);
    setError(null);
  }, []);

  const login = useCallback(async () => {
    setError(null);
    try {
      const session = await fetch(`${getApiUrl()}/auth/stub`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address: localStorage.getItem(STUB_ADDRESS_KEY) ?? undefined }),
      }).then((response) => readJson<AuthSessionResponse>(response));
      applySession(session);
    } catch (reason) {
      logout();
      setError(reason instanceof Error ? reason.message : "Could not sign in");
    }
  }, [applySession, logout]);

  useEffect(() => {
    const existing = localStorage.getItem(TOKEN_KEY);
    if (!existing) {
      setReady(true);
      return;
    }
    let cancelled = false;
    void fetch(`${getApiUrl()}/auth/me`, {
      headers: { authorization: `Bearer ${existing}` },
    })
      .then((response) => readJson<{ player: PlayerProfile }>(response))
      .then((body) => {
        if (cancelled) {
          return;
        }
        setToken(existing);
        setPlayer(body.player);
        setError(null);
        setReady(true);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        logout();
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [logout]);

  const value = useMemo(
    () => ({ player, token, ready, error, login, logout }),
    [error, login, logout, player, ready, token],
  );

  return <WalletAuthContext.Provider value={value}>{children}</WalletAuthContext.Provider>;
}
