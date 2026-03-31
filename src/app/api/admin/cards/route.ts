import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { listCards, insertCard } from "@/lib/supabase/service";
import { generateOpaqueSlug } from "@/lib/slug";
import { playUrlForSlug } from "@/lib/card-url";
import type { CardInsert } from "@/types/card";

export async function GET(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  try {
    const cards = await listCards();
    return NextResponse.json({ cards });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur liste";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

type CreateBody = {
  input_title: string;
  input_artist?: string | null;
  spotify_track_id: string;
  spotify_uri: string;
  title: string;
  artist_name: string;
  album_name?: string | null;
  release_date?: string | null;
  release_year?: number | null;
  duration_ms?: number | null;
  slug?: string;
  is_active?: boolean;
};

export async function POST(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  let body: CreateBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  if (!body.input_title?.trim() || !body.spotify_track_id || !body.spotify_uri) {
    return NextResponse.json(
      { error: "Champs requis manquants" },
      { status: 400 },
    );
  }

  const slug = (body.slug?.trim() || generateOpaqueSlug()).slice(0, 128);
  const qr_url = playUrlForSlug(slug);

  const row: CardInsert = {
    slug,
    input_title: body.input_title.trim(),
    input_artist: body.input_artist?.trim() || null,
    spotify_track_id: body.spotify_track_id.trim(),
    spotify_uri: body.spotify_uri.trim(),
    title: (body.title || body.input_title).trim(),
    artist_name: (body.artist_name || "Inconnu").trim(),
    album_name: body.album_name?.trim() || null,
    release_date: body.release_date?.trim() || null,
    release_year:
      typeof body.release_year === "number" ? body.release_year : null,
    duration_ms:
      typeof body.duration_ms === "number" ? body.duration_ms : null,
    qr_url,
    is_active: body.is_active !== false,
  };

  try {
    const card = await insertCard(row);
    return NextResponse.json({ card });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur création";
    if (msg.includes("duplicate") || msg.includes("23505")) {
      return NextResponse.json(
        { error: "Ce slug existe déjà, réessaie." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
