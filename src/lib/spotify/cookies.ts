import type { NextResponse } from "next/server";

export const SPOTIFY_ACCESS = "wishster_sp_at";
export const SPOTIFY_REFRESH = "wishster_sp_rt";
export const SPOTIFY_EXPIRES = "wishster_sp_exp";
export const SPOTIFY_RETURN = "wishster_sp_return";
export const SPOTIFY_STATE = "wishster_sp_state";

/**
 * Ne mettre Secure que sur HTTPS. Sinon, en `next start` sur http://127.0.0.1
 * le navigateur refuse les cookies et la session Spotify disparaît après le callback.
 */
export function cookieSecureFromRequest(req: Request): boolean {
  try {
    if (new URL(req.url).protocol === "https:") return true;
    const xf = req.headers.get("x-forwarded-proto");
    return xf?.split(",")[0]?.trim() === "https";
  } catch {
    return false;
  }
}

export function clearSpotifyCookies(res: NextResponse) {
  const opts = { path: "/", maxAge: 0 } as const;
  res.cookies.set(SPOTIFY_ACCESS, "", opts);
  res.cookies.set(SPOTIFY_REFRESH, "", opts);
  res.cookies.set(SPOTIFY_EXPIRES, "", opts);
}

/** Lecture d’un cookie brut (évite les bugs si la valeur contient des « = »). */
export function readCookieFromHeader(
  header: string | null,
  name: string,
): string | undefined {
  if (!header) return undefined;
  const needle = `${name}=`;
  for (const part of header.split(";")) {
    const p = part.trim();
    if (p.startsWith(needle)) {
      const raw = p.slice(needle.length);
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    }
  }
  return undefined;
}

/**
 * Pose les jetons Spotify. Si `refresh` est vide, le cookie refresh est effacé
 * (session limitée à expires_in — Spotify omet souvent refresh_token au 2e consentement).
 */
export function setSpotifyTokens(
  res: NextResponse,
  access: string,
  refresh: string | undefined,
  expiresInSec: number,
  secure: boolean,
) {
  const maxAge = 60 * 60 * 24 * 365;
  res.cookies.set(SPOTIFY_ACCESS, access, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge,
  });
  if (refresh) {
    res.cookies.set(SPOTIFY_REFRESH, refresh, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge,
    });
  } else {
    res.cookies.set(SPOTIFY_REFRESH, "", { path: "/", maxAge: 0 });
  }
  const expMs = Date.now() + expiresInSec * 1000;
  res.cookies.set(SPOTIFY_EXPIRES, String(expMs), {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge,
  });
}

export type SpotifyCookieValues = {
  access: string | undefined;
  refresh: string | undefined;
  expiresMs: number | undefined;
};

export function readSpotifyFromRequest(req: Request): SpotifyCookieValues {
  const raw = req.headers.get("cookie") ?? "";
  const map = Object.fromEntries(
    raw
      .split(";")
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => {
        const eq = p.indexOf("=");
        if (eq <= 0) return ["", ""];
        const k = p.slice(0, eq).trim();
        const v = p.slice(eq + 1);
        try {
          return [k, decodeURIComponent(v)];
        } catch {
          return [k, v];
        }
      })
      .filter(([k]) => k.length > 0),
  );
  const exp = map[SPOTIFY_EXPIRES];
  return {
    access: map[SPOTIFY_ACCESS],
    refresh: map[SPOTIFY_REFRESH],
    expiresMs: exp ? Number(exp) : undefined,
  };
}
