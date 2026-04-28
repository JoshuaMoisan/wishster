"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { spotifyLoginUrl } from "@/lib/spotify-login-url";
import { extractSpotifyTrackId } from "@/lib/spotify/parse-track";
import { extractSpotifyPlaylistId } from "@/lib/spotify/parse-playlist";
import type { MappedTrack } from "@/lib/spotify/map-track";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const loginReturn = "/admin/cards/new";

type CreationMode = "single" | "playlist";

export function CardFormNew() {
  const router = useRouter();
  const [creationMode, setCreationMode] = useState<CreationMode>("single");

  const [inputTitle, setInputTitle] = useState("");
  const [inputArtist, setInputArtist] = useState("");
  const [trackUrl, setTrackUrl] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [results, setResults] = useState<MappedTrack[]>([]);
  const [selected, setSelected] = useState<MappedTrack | null>(null);
  const [loading, setLoading] = useState(false);

  const [playlistUrl, setPlaylistUrl] = useState("");
  const [playlistMeta, setPlaylistMeta] = useState<{
    id: string;
    name: string;
    tracks_total: number;
    owner_display_name: string | null;
  } | null>(null);

  async function searchSpotify() {
    const q = searchQ.trim() || `${inputTitle} ${inputArtist}`.trim();
    if (!q) {
      toast.error("Saisis une recherche ou remplis titre / artiste ci‑dessous");
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

  async function loadTrackFromUrl() {
    const id = extractSpotifyTrackId(trackUrl);
    if (!id) {
      toast.error("Colle un lien ou une URI de morceau Spotify (pas une playlist)");
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
        setInputTitle(j.track.title);
        setInputArtist(j.track.artist_name);
        toast.success("Morceau importé");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import impossible");
    } finally {
      setLoading(false);
    }
  }

  function selectTrack(t: MappedTrack) {
    setSelected(t);
    setInputTitle(t.title);
    setInputArtist(t.artist_name);
    toast.message("Morceau sélectionné");
  }

  async function onSubmitSingle(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) {
      toast.error("Choisis ou importe un morceau Spotify");
      return;
    }
    if (!inputTitle.trim()) {
      toast.error("Le titre affiché sur la carte est requis");
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
      const j = (await r.json()) as {
        card?: { id: string; slug: string };
        error?: string;
      };
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

  async function previewPlaylist() {
    const id = extractSpotifyPlaylistId(playlistUrl);
    if (!id) {
      toast.error("Lien ou URI de playlist Spotify invalide");
      setPlaylistMeta(null);
      return;
    }
    setLoading(true);
    setPlaylistMeta(null);
    try {
      const r = await fetch(`/api/spotify/playlists/${encodeURIComponent(id)}`, {
        credentials: "include",
      });
      const j = (await r.json()) as {
        id?: string;
        name?: string;
        tracks_total?: number;
        owner_display_name?: string | null;
        error?: string;
      };
      if (r.status === 401) {
        toast.error("Connecte-toi à Spotify");
        return;
      }
      if (!r.ok) throw new Error(j.error ?? "Playlist introuvable");
      setPlaylistMeta({
        id: j.id!,
        name: j.name ?? "Playlist",
        tracks_total: j.tracks_total ?? 0,
        owner_display_name: j.owner_display_name ?? null,
      });
      toast.success("Playlist reconnue");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lecture impossible");
    } finally {
      setLoading(false);
    }
  }

  async function importPlaylist() {
    if (!playlistUrl.trim()) {
      toast.error("Colle d’abord le lien de la playlist");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/admin/cards/from-playlist", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlist_url: playlistUrl.trim() }),
      });
      const j = (await r.json()) as {
        created?: number;
        attempted?: number;
        errors?: string[];
        error?: string;
      };
      if (r.status === 401) {
        toast.error("Session admin ou Spotify expirée");
        return;
      }
      if (!r.ok) throw new Error(j.error ?? "Import impossible");
      const n = j.created ?? 0;
      const att = j.attempted ?? 0;
      toast.success(`${n} carte${n > 1 ? "s" : ""} créée${n > 1 ? "s" : ""} sur ${att} morceau${att > 1 ? "x" : ""}`);
      if (j.errors?.length) {
        toast.message(j.errors.slice(0, 3).join(" · "));
      }
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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nouvelle carte</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Connecte-toi à Spotify pour accéder aux morceaux et aux playlists.{" "}
          <a
            className="underline underline-offset-4"
            href={spotifyLoginUrl(loginReturn)}
          >
            Connexion Spotify
          </a>
        </p>
      </div>

      <div
        className="flex w-full max-w-md rounded-xl border bg-muted/40 p-1"
        role="tablist"
        aria-label="Mode de création"
      >
        <button
          type="button"
          role="tab"
          aria-selected={creationMode === "single"}
          className={cn(
            "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            creationMode === "single"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => setCreationMode("single")}
        >
          Une carte
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={creationMode === "playlist"}
          className={cn(
            "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            creationMode === "playlist"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => {
            setCreationMode("playlist");
            setPlaylistMeta(null);
          }}
        >
          Depuis une playlist
        </button>
      </div>

      {creationMode === "playlist" ? (
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader>
            <CardTitle>Import playlist</CardTitle>
            <CardDescription>
              Une carte est créée par morceau Spotify (fichiers locaux et
              épisodes exclus). Les playlists privées nécessitent le droit
              « playlist » sur Spotify — reconnecte-toi si besoin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pl-url">Lien ou URI de la playlist</Label>
              <Textarea
                id="pl-url"
                placeholder="https://open.spotify.com/playlist/… ou spotify:playlist:…"
                value={playlistUrl}
                onChange={(e) => {
                  setPlaylistUrl(e.target.value);
                  setPlaylistMeta(null);
                }}
                className="min-h-[88px] rounded-xl"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                className="rounded-xl"
                disabled={loading}
                onClick={() => void previewPlaylist()}
              >
                Vérifier la playlist
              </Button>
              <Button
                type="button"
                className="rounded-xl"
                disabled={loading || !playlistUrl.trim()}
                onClick={() => void importPlaylist()}
              >
                {loading ? "Import…" : "Créer toutes les cartes"}
              </Button>
            </div>
            {playlistMeta ? (
              <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
                <p className="font-medium">{playlistMeta.name}</p>
                <p className="mt-1 text-muted-foreground">
                  {playlistMeta.tracks_total} titre
                  {playlistMeta.tracks_total > 1 ? "s" : ""} indiqué
                  {playlistMeta.tracks_total > 1 ? "s" : ""} par Spotify
                  {playlistMeta.owner_display_name
                    ? ` · par ${playlistMeta.owner_display_name}`
                    : ""}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={onSubmitSingle} className="space-y-8">
          <Card className="rounded-2xl border shadow-sm">
            <CardHeader>
              <CardTitle>1. Morceau Spotify</CardTitle>
              <CardDescription>
                Importe un lien ou recherche, puis sélectionne le bon résultat.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="track-url">Lien ou URI du morceau</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="track-url"
                    placeholder="https://open.spotify.com/track/…"
                    value={trackUrl}
                    onChange={(e) => setTrackUrl(e.target.value)}
                    className="rounded-xl sm:flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    className="rounded-xl sm:shrink-0"
                    disabled={loading}
                    onClick={() => void loadTrackFromUrl()}
                  >
                    Importer
                  </Button>
                </div>
              </div>

              <div className="relative py-2">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                  ou recherche
                </span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="search-q">Recherche Spotify</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="search-q"
                    placeholder="Titre, artiste, mots-clés…"
                    value={searchQ}
                    onChange={(e) => setSearchQ(e.target.value)}
                    className="rounded-xl sm:flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    className="rounded-xl sm:shrink-0"
                    disabled={loading}
                    onClick={() => void searchSpotify()}
                  >
                    Rechercher
                  </Button>
                </div>
              </div>

              <ul className="max-h-64 space-y-1 overflow-auto rounded-xl border p-2">
                {results.map((t) => (
                  <li key={t.spotify_track_id}>
                    <button
                      type="button"
                      className={cn(
                        "w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                        selected?.spotify_track_id === t.spotify_track_id
                          ? "bg-primary/10 ring-1 ring-primary/30"
                          : "hover:bg-muted",
                      )}
                      onClick={() => selectTrack(t)}
                    >
                      <span className="font-medium">{t.title}</span>
                      <span className="mt-0.5 block text-muted-foreground">
                        {t.artist_name}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-sm">
            <CardHeader>
              <CardTitle>2. Libellés sur la carte</CardTitle>
              <CardDescription>
                Texte de référence pour toi et pour l’impression ; les données
                de lecture viennent toujours de Spotify.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="in-title">Titre affiché</Label>
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

          {selected ? (
            <Card className="rounded-2xl border border-dashed bg-muted/20 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Morceau retenu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 text-sm">
                <p>
                  <span className="text-muted-foreground">Titre Spotify :</span>{" "}
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
                <p className="font-mono text-xs text-muted-foreground break-all">
                  {selected.spotify_uri}
                </p>
              </CardContent>
            </Card>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucun morceau sélectionné pour l’instant.
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <Button
              type="submit"
              className="rounded-xl"
              disabled={loading || !selected}
            >
              {loading ? "Enregistrement…" : "Créer la carte"}
            </Button>
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
      )}

      {creationMode === "playlist" ? (
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/cards"
            className={cn(
              buttonVariants({ variant: "outline", size: "default" }),
              "inline-flex rounded-xl",
            )}
          >
            Retour aux cartes
          </Link>
        </div>
      ) : null}
    </div>
  );
}
