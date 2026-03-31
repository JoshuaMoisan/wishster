import { SPOTIFY_TOKEN } from "./constants";

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
};

async function postForm(body: Record<string, string>): Promise<TokenResponse> {
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) throw new Error("Spotify client credentials missing");

  const r = await fetch(SPOTIFY_TOKEN, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
    },
    body: new URLSearchParams(body),
    signal: AbortSignal.timeout(15_000),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Spotify token error ${r.status}: ${t}`);
  }
  return r.json() as Promise<TokenResponse>;
}

export async function exchangeCodeForTokens(code: string, redirectUri: string) {
  return postForm({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });
}

export async function refreshAccessToken(refreshToken: string) {
  return postForm({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
}

export type ResolvedSpotifyToken = {
  accessToken: string;
  didRefresh: boolean;
  rotatedRefresh?: string;
  expiresInSec: number;
};

const BUFFER_MS = 60_000;

export async function getValidAccessToken(opts: {
  access: string | undefined;
  refresh: string | undefined;
  expiresMs: number | undefined;
}): Promise<ResolvedSpotifyToken | null> {
  if (
    opts.access &&
    opts.expiresMs &&
    opts.expiresMs > Date.now() + BUFFER_MS
  ) {
    return {
      accessToken: opts.access,
      didRefresh: false,
      expiresInSec: Math.max(
        60,
        Math.floor((opts.expiresMs - Date.now()) / 1000),
      ),
    };
  }
  if (opts.refresh) {
    const t = await refreshAccessToken(opts.refresh);
    return {
      accessToken: t.access_token,
      didRefresh: true,
      rotatedRefresh: t.refresh_token,
      expiresInSec: t.expires_in,
    };
  }
  if (opts.access) {
    return { accessToken: opts.access, didRefresh: false, expiresInSec: 3600 };
  }
  return null;
}
