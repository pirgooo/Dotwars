interface InviteRecord {
  hostName: string;
}

const invites = new Map<string, InviteRecord>();

export function registerInvite(roomId: string, hostName: string) {
  invites.set(roomId, { hostName });
}

export function unregisterInvite(roomId: string) {
  invites.delete(roomId);
}

export function getInvite(roomId: string): InviteRecord | undefined {
  return invites.get(roomId);
}
