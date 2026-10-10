import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AuthSessionResponse, AuthVerifyRequest, PlayerProfile } from "@dotwars/shared";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { getApiUrl } from "../game/apiUrl";

const TOKEN_KEY = "dotwars.session";
const STUB_ADDRESS_KEY = "dotwars.stubAddress";

interface WalletAuthValue {
  player: PlayerProfile | null;
  token: string | null;
  ready: boolean;
  error: string | null;
  loginStub: () => Promise<void>;
  loginWallet: () => Promise<void>;
  logout: () => void;
}

const WalletAuthContext = createContext<WalletAuthValue>({
  player: null,
  token: null,
  ready: false,
  error: null,
  loginStub: async () => undefined,
  loginWallet: async () => undefined,
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
  const [tonConnectUI] = useTonConnectUI();
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const verifying = useRef(false);

  const applySession = useCallback((session: AuthSessionResponse) => {
    localStorage.setItem(TOKEN_KEY, session.token);
    setToken(session.token);
    setPlayer(session.player);
    setError(null);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setPlayer(null);
    setError(null);
    if (tonConnectUI.connected) {
      void tonConnectUI.disconnect();
    }
  }, [tonConnectUI]);

  const loginStub = useCallback(async () => {
    setError(null);
    try {
      const session = await fetch(`${getApiUrl()}/auth/stub`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address: localStorage.getItem(STUB_ADDRESS_KEY) ?? undefined }),
      }).then((response) => readJson<AuthSessionResponse>(response));
      localStorage.setItem(STUB_ADDRESS_KEY, session.player.address);
      applySession(session);
    } catch (reason) {
      logout();
      setError(reason instanceof Error ? reason.message : "Could not sign in");
    }
  }, [applySession, logout]);

  const loginWallet = useCallback(async () => {
    setError(null);
    try {
      const { payload } = await fetch(`${getApiUrl()}/auth/payload`).then((response) =>
        readJson<{ payload: string }>(response),
      );
      tonConnectUI.setConnectRequestParameters({
        state: "ready",
        value: { tonProof: payload },
      });
      await tonConnectUI.openModal();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not open wallet");
    }
  }, [tonConnectUI]);

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
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setPlayer(null);
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return tonConnectUI.onStatusChange((wallet) => {
      if (!wallet) {
        return;
      }
      const proofItem = wallet.connectItems?.tonProof;
      if (!proofItem || !("proof" in proofItem)) {
        return;
      }
      if (verifying.current || localStorage.getItem(TOKEN_KEY)) {
        return;
      }
      verifying.current = true;
      const body: AuthVerifyRequest = {
        address: wallet.account.address,
        network: String(wallet.account.chain),
        publicKey: wallet.account.publicKey ?? "",
        proof: {
          timestamp: proofItem.proof.timestamp,
          domain: proofItem.proof.domain,
          payload: proofItem.proof.payload,
          signature: proofItem.proof.signature,
          stateInit: wallet.account.walletStateInit,
        },
      };
      void fetch(`${getApiUrl()}/auth/verify`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      })
        .then((response) => readJson<AuthSessionResponse>(response))
        .then(applySession)
        .catch((reason: unknown) => {
          setError(reason instanceof Error ? reason.message : "Could not verify the wallet");
          void tonConnectUI.disconnect();
        })
        .finally(() => {
          verifying.current = false;
        });
    });
  }, [applySession, tonConnectUI]);

  const value = useMemo(
    () => ({ player, token, ready, error, loginStub, loginWallet, logout }),
    [error, loginStub, loginWallet, logout, player, ready, token],
  );

  return <WalletAuthContext.Provider value={value}>{children}</WalletAuthContext.Provider>;
}
