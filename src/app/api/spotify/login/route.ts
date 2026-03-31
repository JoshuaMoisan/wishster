import { NextResponse } from "next/server";
import { SPOTIFY_AUTH, defaultScopes } from "@/lib/spotify/constants";
import {
  SPOTIFY_RETURN,
  SPOTIFY_STATE,
  cookieSecureFromRequest,
} from "@/lib/spotify/cookies";
import { oauthNavigateResponse } from "@/lib/oauth-html-redirect";
import { randomOAuthState } from "@/lib/admin-session";

function sanitizeReturnTo(raw: string | null): string {
  if (!raw || !raw.startsWith("/")) return "/";
  if (raw.startsWith("//")) return "/";
  return raw.slice(0, 512);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const returnTo = sanitizeReturnTo(searchParams.get("returnTo"));

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "Configuration Spotify incomplète" },
      { status: 500 },
    );
  }

  const state = randomOAuthState();
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: defaultScopes(),
    state,
    show_dialog: "true",
  });

  const spotifyAuthorizeUrl = `${SPOTIFY_AUTH}?${params.toString()}`;
  const secure = cookieSecureFromRequest(req);
  const maxAge = 600;

  return oauthNavigateResponse(spotifyAuthorizeUrl, (res) => {
    res.cookies.set(SPOTIFY_RETURN, returnTo, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge,
    });
    res.cookies.set(SPOTIFY_STATE, state, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge,
    });
  });
}
