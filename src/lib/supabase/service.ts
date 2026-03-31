import { createClient } from "@supabase/supabase-js";
import type { Card, CardInsert } from "@/types/card";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export function getServiceSupabase() {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export async function getCardBySlug(
  slug: string,
): Promise<Card | null> {
  const sb = getServiceSupabase();
  const { data, error } = await sb
    .from("cards")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data as Card | null;
}

export async function getActiveCardPlayPayload(slug: string) {
  const card = await getCardBySlug(slug);
  if (!card) return null;
  return {
    slug: card.slug,
    spotifyUri: card.spotify_uri,
    durationMs: card.duration_ms,
  };
}

export async function insertCard(row: CardInsert): Promise<Card> {
  const sb = getServiceSupabase();
  const { data, error } = await sb.from("cards").insert(row).select().single();
  if (error) throw error;
  return data as Card;
}

export async function updateCard(
  id: string,
  patch: Partial<CardInsert>,
): Promise<Card> {
  const sb = getServiceSupabase();
  const { data, error } = await sb
    .from("cards")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Card;
}

export async function deleteCard(id: string): Promise<void> {
  const sb = getServiceSupabase();
  const { error } = await sb.from("cards").delete().eq("id", id);
  if (error) throw error;
}

export async function listCards(): Promise<Card[]> {
  const sb = getServiceSupabase();
  const { data, error } = await sb
    .from("cards")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Card[];
}

export async function getCardById(id: string): Promise<Card | null> {
  const sb = getServiceSupabase();
  const { data, error } = await sb
    .from("cards")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Card | null;
}
