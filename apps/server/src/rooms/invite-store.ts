interface InviteRecord {
  hostName: string;
  stakeGrams: number;
  rakeBps: number;
}

const invites = new Map<string, InviteRecord>();

export function registerInvite(roomId: string, hostName: string, stakeGrams = 0, rakeBps = 0) {
  invites.set(roomId, { hostName, stakeGrams, rakeBps });
}

export function unregisterInvite(roomId: string) {
  invites.delete(roomId);
}

export function getInvite(roomId: string): InviteRecord | undefined {
  return invites.get(roomId);
}
