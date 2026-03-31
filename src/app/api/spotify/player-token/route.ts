import { NextResponse } from "next/server";
import { readSpotifyFromRequest } from "@/lib/spotify/cookies";
import { getValidAccessToken } from "@/lib/spotify/token";
import { attachSpotifyTokensIfNeeded } from "@/lib/spotify/attach-tokens";

/**
 * Fournit un access token au Web Playback SDK (callback getOAuthToken).
 * Réponse JSON : éviter de logger côté client.
 */
export async function GET(req: Request) {
  const prev = readSpotifyFromRequest(req);
  const resolved = await getValidAccessToken(prev);
  if (!resolved) {
    return NextResponse.json(
      { error: "Non connecté à Spotify" },
      { status: 401 },
    );
  }
  const res = NextResponse.json({ access_token: resolved.accessToken });
  attachSpotifyTokensIfNeeded(res, req, prev, resolved);
  return res;
}
