import { SPOTIFY_API } from "./constants";

export async function spotifyApiJson<T>(
  accessToken: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = path.startsWith("http") ? path : `${SPOTIFY_API}${path}`;
  const r = await fetch(url, {
    ...init,
    signal: init?.signal ?? AbortSignal.timeout(15_000),
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers as Record<string, string>),
    },
  });
  if (r.status === 401) {
    const err = new Error("Spotify 401");
    (err as Error & { status: number }).status = 401;
    throw err;
  }
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Spotify API ${r.status}: ${t}`);
  }
  if (r.status === 204) return undefined as T;
  return r.json() as Promise<T>;
}
