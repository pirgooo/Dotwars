export function getApiUrl(): string {
  const explicit = import.meta.env.VITE_API_URL as string | undefined;
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  return `${window.location.protocol}//${window.location.hostname}:2567`;
}
