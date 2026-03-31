import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getActiveCardPlayPayload } from "@/lib/supabase/service";
import { PlayGame } from "@/components/play/play-game";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Partie | Wishster",
    description: "Jeu musical Wishster",
  };
}

export default async function PlayPage({ params }: Props) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);
  const payload = await getActiveCardPlayPayload(decoded);
  if (!payload) notFound();

  return (
    <PlayGame
      slug={payload.slug}
      spotifyUri={payload.spotifyUri}
      durationMs={payload.durationMs}
    />
  );
}
