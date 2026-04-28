import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { readSpotifyFromRequest } from "@/lib/spotify/cookies";
import { getValidAccessToken } from "@/lib/spotify/token";
import { attachSpotifyTokensIfNeeded } from "@/lib/spotify/attach-tokens";
import { extractSpotifyPlaylistId } from "@/lib/spotify/parse-playlist";
import { fetchAllPlaylistTracksMapped } from "@/lib/spotify/playlist-tracks";
import type { MappedTrack } from "@/lib/spotify/map-track";
import { insertCard } from "@/lib/supabase/service";
import { generateOpaqueSlug } from "@/lib/slug";
import { playUrlForSlug } from "@/lib/card-url";
import type { CardInsert } from "@/types/card";

export const maxDuration = 120;

function buildRow(m: MappedTrack): CardInsert {
  const slug = generateOpaqueSlug();
  return {
    slug,
    input_title: m.title,
    input_artist: m.artist_name || null,
    spotify_track_id: m.spotify_track_id,
    spotify_uri: m.spotify_uri,
    title: m.title,
    artist_name: m.artist_name,
    album_name: m.album_name,
    release_date: m.release_date,
    release_year: m.release_year,
    duration_ms: m.duration_ms,
    qr_url: playUrlForSlug(slug),
    is_active: true,
  };
}

async function insertCardWithRetries(m: MappedTrack): Promise<void> {
  let lastErr: unknown;
  for (let i = 0; i < 5; i++) {
    const row = buildRow(m);
    try {
      await insertCard(row);
      return;
    } catch (e) {
      lastErr = e;
      const msg = e instanceof Error ? e.message : "";
      if (!msg.includes("23505") && !msg.includes("duplicate")) throw e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("insert_failed");
}

type Body = { playlist_url?: string };

export async function POST(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const playlistId = extractSpotifyPlaylistId(body.playlist_url ?? "");
  if (!playlistId) {
    return NextResponse.json(
      { error: "Lien ou URI de playlist Spotify invalide" },
      { status: 400 },
    );
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
    const tracks = await fetchAllPlaylistTracksMapped(
      resolved.accessToken,
      playlistId,
    );

    if (!tracks.length) {
      return NextResponse.json(
        {
          error:
            "Aucun morceau importable (titres locaux ou épisodes exclus). Vérifie que la playlist contient des morceaux Spotify.",
        },
        { status: 400 },
      );
    }

    let created = 0;
    const errors: string[] = [];

    for (const m of tracks) {
      try {
        await insertCardWithRetries(m);
        created += 1;
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Erreur lors de la création d’une carte";
        errors.push(`${m.title} — ${msg}`);
      }
    }

    const res = NextResponse.json({
      created,
      attempted: tracks.length,
      errors: errors.slice(0, 8),
    });
    attachSpotifyTokensIfNeeded(res, req, prev, resolved);
    return res;
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "Impossible de lire la playlist Spotify";
    const res = NextResponse.json({ error: msg }, { status: 502 });
    try {
      attachSpotifyTokensIfNeeded(res, req, prev, resolved);
    } catch {
      /* ignore */
    }
    return res;
  }
}
