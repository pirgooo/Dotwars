export function getColyseusUrl(): string {
  const explicit = import.meta.env.VITE_COLYSEUS_URL as string | undefined;
  if (explicit) {
    return explicit;
  }
  const { protocol, hostname, port } = window.location;
  const ws = protocol === "https:" ? "wss:" : "ws:";
  if (port === "5173" || hostname === "localhost" || hostname === "127.0.0.1") {
    return `${ws}//${hostname}:2567`;
  }
  return `${ws}//${hostname}${port ? `:${port}` : ""}`;
}
