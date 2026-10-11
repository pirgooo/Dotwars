export function getApiUrl(): string {
  const explicit = import.meta.env.VITE_API_URL as string | undefined;
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  const { protocol, hostname, port } = window.location;
  if (port === "5173" || hostname === "localhost" || hostname === "127.0.0.1") {
    return `${protocol}//${hostname}:2567`;
  }
  return window.location.origin.replace(/\/$/, "");
}

export async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  let data: T & { message?: string | string[] };
  try {
    data = JSON.parse(text) as T & { message?: string | string[] };
  } catch {
    throw new Error(response.ok ? "Server sent an invalid response" : "No server connection");
  }
  if (!response.ok) {
    const message = Array.isArray(data.message) ? data.message[0] : data.message;
    throw new Error(message || "Request failed");
  }
  return data;
}
