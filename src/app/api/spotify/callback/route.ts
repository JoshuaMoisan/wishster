import { NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/spotify/token";
import {
  SPOTIFY_RETURN,
  SPOTIFY_STATE,
  cookieSecureFromRequest,
  readCookieFromHeader,
  readSpotifyFromRequest,
  setSpotifyTokens,
} from "@/lib/spotify/cookies";
import { oauthNavigateResponse } from "@/lib/oauth-html-redirect";
import { getRequestOrigin } from "@/lib/request-origin";

export async function GET(req: Request) {
  const base = new URL(req.url);
  const code = base.searchParams.get("code");
  const state = base.searchParams.get("state");
  const err = base.searchParams.get("error");

  const cookieHeader = req.headers.get("cookie");
  const expectedState = readCookieFromHeader(cookieHeader, SPOTIFY_STATE);
  const returnToRaw = readCookieFromHeader(cookieHeader, SPOTIFY_RETURN) ?? "/";
  const priorSession = readSpotifyFromRequest(req);

  const clearOAuthCookies = (res: NextResponse) => {
    res.cookies.set(SPOTIFY_RETURN, "", { path: "/", maxAge: 0 });
    res.cookies.set(SPOTIFY_STATE, "", { path: "/", maxAge: 0 });
  };

  const redirectWithError = (key: string) => {
    const u = new URL("/", getRequestOrigin(req));
    u.searchParams.set("spotify_error", key);
    return oauthNavigateResponse(u.toString(), (res) => {
      clearOAuthCookies(res);
    });
  };

  if (err) {
    return redirectWithError(err);
  }

  if (!code || !state || state !== expectedState) {
    return redirectWithError("invalid_state");
  }

  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
  if (!redirectUri) {
    return NextResponse.json(
      { error: "SPOTIFY_REDIRECT_URI manquant" },
      { status: 500 },
    );
  }

  try {
    const tokens = await exchangeCodeForTokens(code, redirectUri);
    if (!tokens.access_token) {
      return redirectWithError("token_exchange");
    }

    const refresh =
      tokens.refresh_token?.trim() || priorSession.refresh?.trim() || undefined;

    const target = new URL(returnToRaw, `${getRequestOrigin(req)}/`).toString();
    const secure = cookieSecureFromRequest(req);

    return oauthNavigateResponse(target, (res) => {
      clearOAuthCookies(res);
      setSpotifyTokens(
        res,
        tokens.access_token,
        refresh,
        tokens.expires_in,
        secure,
      );
    });
  } catch {
    return redirectWithError("token_exchange");
  }
}
