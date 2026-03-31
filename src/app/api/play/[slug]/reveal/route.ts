import { NextResponse } from "next/server";
import { getCardBySlug } from "@/lib/supabase/service";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;
  if (!slug) {
    return NextResponse.json({ error: "Slug manquant" }, { status: 400 });
  }

  try {
    const card = await getCardBySlug(decodeURIComponent(slug));
    if (!card) {
      return NextResponse.json({ error: "Carte introuvable" }, { status: 404 });
    }
    return NextResponse.json({
      title: card.title,
      artist_name: card.artist_name,
      release_date: card.release_date,
      release_year: card.release_year,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
