import { NextResponse } from "next/server";
import { readSpotifyFromRequest } from "@/lib/spotify/cookies";
import { getValidAccessToken } from "@/lib/spotify/token";
import { spotifyApiJson } from "@/lib/spotify/fetch";
import { attachSpotifyTokensIfNeeded } from "@/lib/spotify/attach-tokens";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "ID playlist manquant" }, { status: 400 });
  }

  const prev = readSpotifyFromRequest(req);
  const resolved = await getValidAccessToken(prev);
  if (!resolved) {
    return NextResponse.json(
      { error: "Connecte-toi à Spotify d’abord" },
      { status: 401 },
    );
  }

  const q = new URLSearchParams({
    fields: "name,tracks.total,owner.display_name",
  }).toString();

  try {
    const data = await spotifyApiJson<{
      name: string;
      tracks: { total: number };
      owner?: { display_name?: string };
    }>(resolved.accessToken, `/playlists/${encodeURIComponent(id)}?${q}`);

    const res = NextResponse.json({
      id,
      name: data.name,
      tracks_total: data.tracks?.total ?? 0,
      owner_display_name: data.owner?.display_name ?? null,
    });
    attachSpotifyTokensIfNeeded(res, req, prev, resolved);
    return res;
  } catch {
    return NextResponse.json(
      { error: "Playlist introuvable ou accès refusé" },
      { status: 404 },
    );
  }
}
