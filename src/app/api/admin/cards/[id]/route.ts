import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import {
  deleteCard,
  getCardById,
  updateCard,
} from "@/lib/supabase/service";
import { playUrlForSlug } from "@/lib/card-url";
import type { CardInsert } from "@/types/card";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const { id } = await params;
  const card = await getCardById(id);
  if (!card) {
    return NextResponse.json({ error: "Carte introuvable" }, { status: 404 });
  }
  return NextResponse.json({ card });
}

export async function PATCH(req: Request, { params }: Params) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const { id } = await params;

  let body: Partial<
    Pick<
      CardInsert,
      | "input_title"
      | "input_artist"
      | "title"
      | "artist_name"
      | "album_name"
      | "release_date"
      | "release_year"
      | "duration_ms"
      | "slug"
      | "spotify_track_id"
      | "spotify_uri"
    >
  > & { regenerate_qr?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const existing = await getCardById(id);
  if (!existing) {
    return NextResponse.json({ error: "Carte introuvable" }, { status: 404 });
  }

  const patch: Partial<CardInsert> & { is_active?: boolean } = {};
  if (body.input_title !== undefined) patch.input_title = body.input_title;
  if (body.input_artist !== undefined) patch.input_artist = body.input_artist;
  if (body.title !== undefined) patch.title = body.title;
  if (body.artist_name !== undefined) patch.artist_name = body.artist_name;
  if (body.album_name !== undefined) patch.album_name = body.album_name;
  if (body.release_date !== undefined) patch.release_date = body.release_date;
  if (body.release_year !== undefined) patch.release_year = body.release_year;
  if (body.duration_ms !== undefined) patch.duration_ms = body.duration_ms;
  if (body.spotify_track_id !== undefined) {
    patch.spotify_track_id = body.spotify_track_id;
  }
  if (body.spotify_uri !== undefined) patch.spotify_uri = body.spotify_uri;
  let newSlug = existing.slug;
  if (body.slug !== undefined && body.slug.trim()) {
    newSlug = body.slug.trim().slice(0, 128);
    patch.slug = newSlug;
    patch.qr_url = playUrlForSlug(newSlug);
  } else if (body.regenerate_qr) {
    patch.qr_url = playUrlForSlug(existing.slug);
  }

  try {
    const card = await updateCard(id, patch);
    return NextResponse.json({ card });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur mise à jour";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const { id } = await params;
  const existing = await getCardById(id);
  if (!existing) {
    return NextResponse.json({ error: "Carte introuvable" }, { status: 404 });
  }
  try {
    await deleteCard(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur suppression";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
