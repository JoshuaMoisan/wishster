"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { spotifyLoginUrl } from "@/lib/spotify-login-url";
import { extractSpotifyTrackId } from "@/lib/spotify/parse-track";
import type { MappedTrack } from "@/lib/spotify/map-track";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
const loginReturn = "/admin/cards/new";

export function CardFormNew() {
  const router = useRouter();
  const [inputTitle, setInputTitle] = useState("");
  const [inputArtist, setInputArtist] = useState("");
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [results, setResults] = useState<MappedTrack[]>([]);
  const [selected, setSelected] = useState<MappedTrack | null>(null);
  const [loading, setLoading] = useState(false);

  async function searchSpotify() {
    const q = searchQ.trim() || `${inputTitle} ${inputArtist}`.trim();
    if (!q) {
      toast.error("Saisis une recherche ou un titre");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch(
        `/api/spotify/search?q=${encodeURIComponent(q)}`,
        { credentials: "include" },
      );
      const j = (await r.json()) as { tracks?: MappedTrack[]; error?: string };
      if (r.status === 401) {
        toast.error("Connecte-toi à Spotify");
        return;
      }
      if (!r.ok) throw new Error(j.error ?? "Erreur");
      setResults(j.tracks ?? []);
      if (!j.tracks?.length) toast.message("Aucun résultat");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Recherche impossible");
    } finally {
      setLoading(false);
    }
  }

  async function loadFromUrl() {
    const id = extractSpotifyTrackId(spotifyUrl);
    if (!id) {
      toast.error("Lien ou URI Spotify invalide");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch(`/api/spotify/tracks/${encodeURIComponent(id)}`, {
        credentials: "include",
      });
      const j = (await r.json()) as { track?: MappedTrack; error?: string };
      if (r.status === 401) {
        toast.error("Connecte-toi à Spotify");
        return;
      }
      if (!r.ok) throw new Error(j.error ?? "Erreur");
      if (j.track) {
        setSelected(j.track);
        if (!inputTitle.trim()) setInputTitle(j.track.title);
        if (!inputArtist.trim()) setInputArtist(j.track.artist_name);
        toast.success("Morceau importé");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import impossible");
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) {
      toast.error("Choisis un morceau Spotify");
      return;
    }
    if (!inputTitle.trim()) {
      toast.error("Le titre saisi est requis");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/admin/cards", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input_title: inputTitle.trim(),
          input_artist: inputArtist.trim() || null,
          spotify_track_id: selected.spotify_track_id,
          spotify_uri: selected.spotify_uri,
          title: selected.title,
          artist_name: selected.artist_name,
          album_name: selected.album_name,
          release_date: selected.release_date,
          release_year: selected.release_year,
          duration_ms: selected.duration_ms,
        }),
      });
      const j = (await r.json()) as { card?: { id: string; slug: string }; error?: string };
      if (!r.ok) throw new Error(j.error ?? "Création impossible");
      toast.success("Carte créée");
      router.replace(`/admin/cards/${j.card!.id}`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nouvelle carte</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Connecte-toi à Spotify depuis l’accueil pour la recherche et
          l’import.{" "}
          <a
            className="underline underline-offset-4"
            href={spotifyLoginUrl(loginReturn)}
          >
            Connexion Spotify
          </a>
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-8">
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader>
            <CardTitle>Infos carte</CardTitle>
            <CardDescription>
              Le titre saisi sert de référence ; les métadonnées officielles
              viennent de Spotify.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="in-title">Titre (manuel)</Label>
              <Input
                id="in-title"
                value={inputTitle}
                onChange={(e) => setInputTitle(e.target.value)}
                className="rounded-xl"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="in-art">Artiste (optionnel)</Label>
              <Input
                id="in-art"
                value={inputArtist}
                onChange={(e) => setInputArtist(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-xl">
            <TabsTrigger value="search" className="rounded-lg">
              Recherche Spotify
            </TabsTrigger>
            <TabsTrigger value="url" className="rounded-lg">
              Lien / URI
            </TabsTrigger>
          </TabsList>
          <TabsContent value="search" className="mt-4 space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="Recherche (ou laisse vide pour titre + artiste)"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                className="rounded-xl"
              />
              <button
                type="button"
                className={cn(
                  buttonVariants({ variant: "secondary", size: "default" }),
                  "rounded-xl",
                )}
                disabled={loading}
                onClick={() => void searchSpotify()}
              >
                Rechercher
              </button>
            </div>
            <ul className="max-h-72 space-y-2 overflow-auto rounded-xl border p-2">
              {results.map((t) => (
                <li key={t.spotify_track_id}>
                  <button
                    type="button"
                    className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => {
                      setSelected(t);
                      toast.message("Morceau sélectionné");
                    }}
                  >
                    <span className="font-medium">{t.title}</span>
                    <span className="block text-muted-foreground">
                      {t.artist_name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </TabsContent>
          <TabsContent value="url" className="mt-4 space-y-4">
            <Textarea
              placeholder="https://open.spotify.com/track/… ou spotify:track:…"
              value={spotifyUrl}
              onChange={(e) => setSpotifyUrl(e.target.value)}
              className="min-h-[100px] rounded-xl"
            />
            <button
              type="button"
              className={cn(
                buttonVariants({ variant: "secondary", size: "default" }),
                "rounded-xl",
              )}
              disabled={loading}
              onClick={() => void loadFromUrl()}
            >
              Charger le morceau
            </button>
          </TabsContent>
        </Tabs>

        {selected ? (
          <Card className="rounded-2xl border shadow-sm">
            <CardHeader>
              <CardTitle>Morceau retenu</CardTitle>
              <CardDescription>
                Ces champs seront enregistrés avec la carte.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Titre :</span>{" "}
                {selected.title}
              </p>
              <p>
                <span className="text-muted-foreground">Artiste :</span>{" "}
                {selected.artist_name}
              </p>
              <p>
                <span className="text-muted-foreground">Album :</span>{" "}
                {selected.album_name ?? "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Sortie :</span>{" "}
                {selected.release_date ?? "—"}
              </p>
              <p className="font-mono text-xs text-muted-foreground">
                {selected.spotify_uri}
              </p>
            </CardContent>
          </Card>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className={cn(buttonVariants({ size: "default" }), "rounded-xl")}
            disabled={loading}
          >
            {loading ? "Enregistrement…" : "Enregistrer la carte"}
          </button>
          <Link
            href="/admin/cards"
            className={cn(
              buttonVariants({ variant: "outline", size: "default" }),
              "inline-flex rounded-xl",
            )}
          >
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}
