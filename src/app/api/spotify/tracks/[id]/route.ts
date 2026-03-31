import { NextResponse } from "next/server";
import { readSpotifyFromRequest } from "@/lib/spotify/cookies";
import { getValidAccessToken } from "@/lib/spotify/token";
import { spotifyApiJson } from "@/lib/spotify/fetch";
import { attachSpotifyTokensIfNeeded } from "@/lib/spotify/attach-tokens";
import { mapSpotifyTrack, type SpotifyTrackApi } from "@/lib/spotify/map-track";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "ID manquant" }, { status: 400 });
  }

  const prev = readSpotifyFromRequest(req);
  const resolved = await getValidAccessToken(prev);
  if (!resolved) {
    return NextResponse.json(
      { error: "Connecte-toi à Spotify d’abord" },
      { status: 401 },
    );
  }

  try {
    const t = await spotifyApiJson<SpotifyTrackApi>(
      resolved.accessToken,
      `/tracks/${encodeURIComponent(id)}`,
    );
    const res = NextResponse.json({ track: mapSpotifyTrack(t) });
    attachSpotifyTokensIfNeeded(res, req, prev, resolved);
    return res;
  } catch {
    return NextResponse.json(
      { error: "Morceau introuvable" },
      { status: 404 },
    );
  }
}
