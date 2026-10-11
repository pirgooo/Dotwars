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
import { getApiUrl, readJson } from "../game/apiUrl";
import { inTelegramMiniApp, waitTelegramInitData } from "../telegram";

const TOKEN_KEY = "dotwars.session";

interface WalletAuthValue {
  player: PlayerProfile | null;
  token: string | null;
  ready: boolean;
  error: string | null;
  login: () => Promise<void>;
  loginWallet: () => Promise<void>;
  refresh: () => Promise<void>;
  rename: (name: string) => Promise<void>;
  logout: () => void;
}

const WalletAuthContext = createContext<WalletAuthValue>({
  player: null,
  token: null,
  ready: false,
  error: null,
  login: async () => undefined,
  loginWallet: async () => undefined,
  refresh: async () => undefined,
  rename: async () => undefined,
  logout: () => undefined,
});

export function useWalletAuth() {
  return useContext(WalletAuthContext);
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

  const loginTelegram = useCallback(async (initData: string) => {
    const session = await fetch(`${getApiUrl()}/auth/telegram`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ initData }),
    }).then((response) => readJson<AuthSessionResponse>(response));
    applySession(session);
  }, [applySession]);

  const refresh = useCallback(async () => {
    const session = localStorage.getItem(TOKEN_KEY);
    if (!session) {
      return;
    }
    try {
      const body = await fetch(`${getApiUrl()}/auth/me`, {
        headers: { authorization: `Bearer ${session}` },
      }).then((response) => readJson<{ player: PlayerProfile }>(response));
      setPlayer((current) => ({ ...body.player, stub: current?.stub ?? body.player.stub }));
    } catch {
      // Keep the last known profile if the stats fetch fails.
    }
  }, []);

  const rename = useCallback(
    async (name: string) => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        throw new Error("Connect Gram wallet");
      }
      setError(null);
      const body = await fetch(`${getApiUrl()}/auth/me`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      }).then((response) => readJson<{ player: PlayerProfile }>(response));
      setPlayer((current) => ({ ...body.player, stub: current?.stub ?? body.player.stub }));
    },
    [],
  );

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

  const login = useCallback(async () => {
    setError(null);
    try {
      const initData = await waitTelegramInitData(800);
      if (initData) {
        await loginTelegram(initData);
        return;
      }
      await loginWallet();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not sign in");
    }
  }, [loginTelegram, loginWallet]);

  useEffect(() => {
    let cancelled = false;

    const finish = () => {
      if (!cancelled) {
        setReady(true);
      }
    };

    const boot = async () => {
      const initData = await waitTelegramInitData();
      const existing = localStorage.getItem(TOKEN_KEY);
      if (existing) {
        try {
          const body = await fetch(`${getApiUrl()}/auth/me`, {
            headers: { authorization: `Bearer ${existing}` },
          }).then((response) => readJson<{ player: PlayerProfile }>(response));
          if (cancelled) {
            return;
          }
          if (!body.player.stub || !initData) {
            setToken(existing);
            setPlayer(body.player);
            setError(null);
            finish();
            return;
          }
        } catch {
          localStorage.removeItem(TOKEN_KEY);
          if (!cancelled) {
            setToken(null);
            setPlayer(null);
          }
        }
      }
      if (initData) {
        try {
          await loginTelegram(initData);
        } catch (reason) {
          if (!cancelled) {
            setError(reason instanceof Error ? reason.message : "Could not sign in with Telegram");
          }
        }
      } else if (inTelegramMiniApp()) {
        setError("Could not read Telegram login. Close the Mini App and open it from the bot.");
      }
      finish();
    };

    void boot();
    return () => {
      cancelled = true;
    };
  }, [loginTelegram]);

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
    () => ({ player, token, ready, error, login, loginWallet, refresh, rename, logout }),
    [error, login, loginWallet, logout, player, ready, refresh, rename, token],
  );

  return <WalletAuthContext.Provider value={value}>{children}</WalletAuthContext.Provider>;
}
