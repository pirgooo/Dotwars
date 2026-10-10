export function getColyseusUrl(): string {
  const explicit = import.meta.env.VITE_COLYSEUS_URL as string | undefined;
  if (explicit) {
    return explicit;
  }
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.hostname}:2567`;
}
