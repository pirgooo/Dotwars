export interface PlayerProfile {
  address: string;
  name: string;
  wins: number;
  losses: number;
  draws: number;
  games: number;
}

export interface TonProofPayload {
  timestamp: number;
  domain: {
    lengthBytes: number;
    value: string;
  };
  payload: string;
  signature: string;
  stateInit: string;
}

export interface AuthVerifyRequest {
  address: string;
  network: string;
  publicKey: string;
  proof: TonProofPayload;
}

export interface AuthSessionResponse {
  token: string;
  player: PlayerProfile;
}

export interface InviteInfo {
  roomId: string;
  hostName: string;
}

export function shortWalletName(address: string): string {
  const hex = address.includes(":") ? address.split(":")[1] ?? address : address;
  if (hex.length < 8) {
    return address;
  }
  return `${hex.slice(0, 4)}…${hex.slice(-4)}`;
}
