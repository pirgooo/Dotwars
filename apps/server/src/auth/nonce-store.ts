const TTL_MS = 15 * 60 * 1000;
const issued = new Map<string, number>();

export function issueNonce(payload: string) {
  issued.set(payload, Date.now() + TTL_MS);
}

export function consumeNonce(payload: string): boolean {
  const until = issued.get(payload);
  issued.delete(payload);
  return Boolean(until && until >= Date.now());
}
