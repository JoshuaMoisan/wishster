import { NextResponse } from "next/server";
import { readSpotifyFromRequest } from "@/lib/spotify/cookies";
import { getValidAccessToken } from "@/lib/spotify/token";
import { spotifyApiJson } from "@/lib/spotify/fetch";
import { attachSpotifyTokensIfNeeded } from "@/lib/spotify/attach-tokens";

export async function GET(req: Request) {
  const prev = readSpotifyFromRequest(req);
  try {
    const resolved = await getValidAccessToken(prev);
    if (!resolved) {
      return NextResponse.json(
        { connected: false },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    let product: string = "unknown";
    try {
      const me = await spotifyApiJson<{ product: string }>(
        resolved.accessToken,
        "/me",
      );
      product = me.product;
    } catch {
      /* ignore */
    }
    const res = NextResponse.json(
      { connected: true, product },
      { headers: { "Cache-Control": "no-store" } },
    );
    attachSpotifyTokensIfNeeded(res, req, prev, resolved);
    return res;
  } catch {
    return NextResponse.json(
      { connected: false },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
