"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Card as CardRow } from "@/types/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { QrDisplay } from "@/components/qr/qr-display";
import { toast } from "sonner";

export function CardFormEdit({ initial }: { initial: CardRow }) {
  const router = useRouter();
  const [card, setCard] = useState(initial);
  const [loading, setLoading] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/cards/${card.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input_title: card.input_title,
          input_artist: card.input_artist,
          title: card.title,
          artist_name: card.artist_name,
          album_name: card.album_name,
          release_date: card.release_date,
          release_year: card.release_year,
          duration_ms: card.duration_ms,
          slug: card.slug,
          spotify_track_id: card.spotify_track_id,
          spotify_uri: card.spotify_uri,
        }),
      });
      const j = (await r.json()) as { card?: CardRow; error?: string };
      if (!r.ok) throw new Error(j.error ?? "Erreur");
      if (j.card) setCard(j.card);
      toast.success("Enregistré");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function regenerateQr() {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/cards/${card.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regenerate_qr: true }),
      });
      const j = (await r.json()) as { card?: CardRow; error?: string };
      if (!r.ok) throw new Error(j.error ?? "Erreur");
      if (j.card) setCard(j.card);
      toast.success("QR mis à jour (URL alignée sur le slug)");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  function test() {
    window.open(card.qr_url, "_blank", "noopener,noreferrer");
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(card.qr_url);
      toast.success("Lien copié");
    } catch {
      toast.error("Copie impossible");
    }
  }

  async function removeCard() {
    if (!confirm("Supprimer définitivement cette carte ?")) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/cards/${card.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!r.ok) throw new Error("Suppression impossible");
      toast.success("Carte supprimée");
      router.replace("/admin/cards");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Éditer la carte</h1>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/cards"
            className={cn(
              buttonVariants({ variant: "outline", size: "default" }),
              "rounded-xl",
            )}
          >
            Retour liste
          </Link>
          <button
            type="button"
            className={cn(
              buttonVariants({ variant: "destructive", size: "default" }),
              "rounded-xl",
            )}
            disabled={loading}
            onClick={() => void removeCard()}
          >
            Supprimer la carte
          </button>
        </div>
      </div>

      <Card className="rounded-2xl border shadow-sm">
        <CardHeader>
          <CardTitle>QR & lien</CardTitle>
          <CardDescription>
            Le QR encode toujours l’URL publique de jeu (pas Spotify).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <QrDisplay value={card.qr_url} size={160} className="rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2 text-sm">
            <p className="break-all font-mono text-xs text-muted-foreground">
              {card.qr_url}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={cn(
                  buttonVariants({ variant: "secondary", size: "sm" }),
                  "rounded-lg",
                )}
                onClick={() => void copyLink()}
              >
                Copier le lien
              </button>
              <button
                type="button"
                className={cn(
                  buttonVariants({ variant: "secondary", size: "sm" }),
                  "rounded-lg",
                )}
                onClick={test}
              >
                Tester
              </button>
              <button
                type="button"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "rounded-lg",
                )}
                disabled={loading}
                onClick={() => void regenerateQr()}
              >
                Régénérer QR / URL
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={save} className="space-y-6">
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader>
            <CardTitle>Champs</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={card.slug}
                onChange={(e) =>
                  setCard((c) => ({ ...c, slug: e.target.value }))
                }
                className="rounded-xl font-mono text-sm"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="in-title">Titre saisi (réf.)</Label>
              <Input
                id="in-title"
                value={card.input_title}
                onChange={(e) =>
                  setCard((c) => ({ ...c, input_title: e.target.value }))
                }
                className="rounded-xl"
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="in-art">Artiste saisi</Label>
              <Input
                id="in-art"
                value={card.input_artist ?? ""}
                onChange={(e) =>
                  setCard((c) => ({
                    ...c,
                    input_artist: e.target.value || null,
                  }))
                }
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Titre (révélation)</Label>
              <Input
                id="title"
                value={card.title}
                onChange={(e) =>
                  setCard((c) => ({ ...c, title: e.target.value }))
                }
                className="rounded-xl"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="artist">Artiste</Label>
              <Input
                id="artist"
                value={card.artist_name}
                onChange={(e) =>
                  setCard((c) => ({ ...c, artist_name: e.target.value }))
                }
                className="rounded-xl"
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="album">Album</Label>
              <Input
                id="album"
                value={card.album_name ?? ""}
                onChange={(e) =>
                  setCard((c) => ({
                    ...c,
                    album_name: e.target.value || null,
                  }))
                }
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rel">Date de sortie</Label>
              <Input
                id="rel"
                value={card.release_date ?? ""}
                onChange={(e) =>
                  setCard((c) => ({
                    ...c,
                    release_date: e.target.value || null,
                  }))
                }
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Année</Label>
              <Input
                id="year"
                type="number"
                value={card.release_year ?? ""}
                onChange={(e) =>
                  setCard((c) => ({
                    ...c,
                    release_year: e.target.value
                      ? Number(e.target.value)
                      : null,
                  }))
                }
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="uri">URI Spotify</Label>
              <Input
                id="uri"
                value={card.spotify_uri}
                onChange={(e) =>
                  setCard((c) => ({ ...c, spotify_uri: e.target.value }))
                }
                className="rounded-xl font-mono text-sm"
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="tid">Track ID Spotify</Label>
              <Input
                id="tid"
                value={card.spotify_track_id}
                onChange={(e) =>
                  setCard((c) => ({
                    ...c,
                    spotify_track_id: e.target.value,
                  }))
                }
                className="rounded-xl font-mono text-sm"
                required
              />
            </div>
          </CardContent>
        </Card>

        <button
          type="submit"
          className={cn(buttonVariants({ size: "default" }), "rounded-xl")}
          disabled={loading}
        >
          {loading ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}
