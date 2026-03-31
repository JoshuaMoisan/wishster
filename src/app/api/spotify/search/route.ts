import { NextResponse } from "next/server";
import { readSpotifyFromRequest } from "@/lib/spotify/cookies";
import { getValidAccessToken } from "@/lib/spotify/token";
import { spotifyApiJson } from "@/lib/spotify/fetch";
import { attachSpotifyTokensIfNeeded } from "@/lib/spotify/attach-tokens";
import { mapSpotifyTrack, type SpotifyTrackApi } from "@/lib/spotify/map-track";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "Paramètre q requis" }, { status: 400 });
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
    const path =
      "/search?" +
      new URLSearchParams({
        q,
        type: "track",
        limit: "20",
      }).toString();
    const data = await spotifyApiJson<{
      tracks: { items: SpotifyTrackApi[] };
    }>(resolved.accessToken, path);
    const tracks = (data.tracks?.items ?? []).map(mapSpotifyTrack);
    const res = NextResponse.json({ tracks });
    attachSpotifyTokensIfNeeded(res, req, prev, resolved);
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur recherche";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
