"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSpotifyWebPlayer } from "@/hooks/use-spotify-web-player";
import type { CardReveal } from "@/types/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { spotifyLoginUrl } from "@/lib/spotify-login-url";
import { formatReleaseDdMmYyyy } from "@/lib/format-release-display";
import { Loader2 } from "lucide-react";

type Props = {
  slug: string;
  spotifyUri: string;
  durationMs: number | null;
};

export function PlayGame({ slug, spotifyUri, durationMs }: Props) {
  const [session, setSession] = useState<{
    connected: boolean;
    product?: string;
  } | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [revealData, setRevealData] = useState<CardReveal | null>(null);
  const [playStarted, setPlayStarted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [playPhase, setPlayPhase] = useState<"idle" | "device" | "stream">(
    "idle",
  );
  const [msg, setMsg] = useState<string | null>(null);

  const {
    connectPlayer,
    playUri,
    error: playerError,
    clearError,
    getState,
    seek,
    pause,
  } = useSpotifyWebPlayer();

  const returnPath = `/play/${encodeURIComponent(slug)}`;
  const loginHref = spotifyLoginUrl(returnPath);

  useEffect(() => {
    let alive = true;
    const ac = new AbortController();
    const timer = window.setTimeout(() => ac.abort(), 35_000);
    void fetch("/api/spotify/session", {
      credentials: "include",
      cache: "no-store",
      signal: ac.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        if (alive) setSession(data);
      })
      .catch(() => {
        if (alive) setSession({ connected: false });
      })
      .finally(() => {
        window.clearTimeout(timer);
      });
    return () => {
      alive = false;
      ac.abort();
    };
  }, []);

  const fetchReveal = useCallback(async () => {
    try {
      await pause();
    } catch {
      /* ignore */
    }
    const r = await fetch(`/api/play/${encodeURIComponent(slug)}/reveal`, {
      credentials: "omit",
    });
    if (!r.ok) {
      setMsg("Impossible de charger la révélation.");
      return;
    }
    const j = (await r.json()) as CardReveal;
    setRevealData(j);
    setRevealed(true);
  }, [slug, pause]);

  useEffect(() => {
    if (revealed || !playStarted) return;
    const tick = async () => {
      const s = await getState();
      if (!s?.track_window?.current_track) return;
      if (s.track_window.current_track.uri !== spotifyUri) return;
      const dur = s.duration || durationMs || 0;
      const pos = s.position;
      if (dur > 0 && pos >= dur - 1500) {
        try {
          await pause();
        } catch {
          /* ignore */
        }
        await fetchReveal();
      }
    };
    const id = window.setInterval(() => void tick(), 900);
    return () => window.clearInterval(id);
  }, [revealed, playStarted, spotifyUri, durationMs, getState, fetchReveal]);

  const onPlay = async () => {
    setBusy(true);
    setPlayPhase("device");
    setMsg(null);
    clearError();
    try {
      await connectPlayer();
      setPlayPhase("stream");
      await playUri(spotifyUri);
      setPlayStarted(true);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erreur de lecture");
    } finally {
      setBusy(false);
      setPlayPhase("idle");
    }
  };

  const onReplay = async () => {
    setBusy(true);
    setPlayPhase("device");
    setMsg(null);
    clearError();
    try {
      await connectPlayer();
      setPlayPhase("stream");
      await seek(0);
      await playUri(spotifyUri);
      setRevealed(false);
      setRevealData(null);
      setPlayStarted(true);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
      setPlayPhase("idle");
    }
  };

  if (session === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <p className="text-muted-foreground">Chargement…</p>
      </div>
    );
  }

  const showFreeTierWarning = session.product === "free";
  const releaseLine = revealData
    ? formatReleaseDdMmYyyy(revealData.release_date, revealData.release_year)
    : null;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center gap-6 px-4 py-12">
      <div className="text-center">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Wishster
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Écoute le morceau — aucun indice avant la révélation.
        </p>
      </div>

      {!session.connected ? (
        <Card className="rounded-2xl border shadow-sm">
          <CardHeader>
            <CardTitle>Spotify requis</CardTitle>
            <CardDescription>
              Connecte ton compte Spotify pour lancer la lecture dans le
              navigateur (Premium requis pour le lecteur intégré).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a
              href={loginHref}
              className={cn(
                buttonVariants({ size: "lg" }),
                "inline-flex w-full justify-center rounded-xl",
              )}
            >
              Se connecter à Spotify
            </a>
          </CardContent>
        </Card>
      ) : (
        <>
          {session.connected && showFreeTierWarning ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
              Compte Spotify gratuit : le lecteur intégré ne fonctionne pas
              (Premium requis). Tu peux quand même ouvrir le morceau dans
              l’app Spotify si tu préfères.
            </p>
          ) : null}

          {!revealed ? (
            <Card className="rounded-2xl border shadow-sm">
              <CardContent className="flex flex-col gap-3 pt-6">
                <button
                  type="button"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "inline-flex w-full items-center justify-center gap-2 rounded-xl",
                  )}
                  disabled={busy}
                  onClick={() => void onPlay()}
                >
                  {busy ? (
                    <>
                      <Loader2
                        className="size-5 shrink-0 animate-spin"
                        aria-hidden
                      />
                      <span>
                        {playPhase === "device"
                          ? "Préparation du lecteur…"
                          : "Démarrage de la lecture…"}
                      </span>
                    </>
                  ) : (
                    "Lancer la musique"
                  )}
                </button>
                <button
                  type="button"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "default" }),
                    "w-full rounded-xl",
                  )}
                  disabled={busy}
                  onClick={() => void fetchReveal()}
                >
                  Révéler
                </button>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-2xl border shadow-sm">
              <CardContent className="space-y-2 px-6 py-8 text-center">
                <p className="text-xl font-semibold">{revealData?.title}</p>
                <p className="text-muted-foreground">{revealData?.artist_name}</p>
                {releaseLine ? (
                  <p className="text-sm text-muted-foreground">
                    Sortie : {releaseLine}
                  </p>
                ) : null}
                <div className="flex flex-col gap-2 pt-4 sm:flex-row sm:justify-center">
                  <button
                    type="button"
                    className={cn(
                      buttonVariants({ variant: "secondary", size: "default" }),
                      "inline-flex items-center justify-center gap-2 rounded-xl",
                    )}
                    disabled={busy}
                    onClick={() => void onReplay()}
                  >
                    {busy ? (
                      <>
                        <Loader2
                          className="size-4 shrink-0 animate-spin"
                          aria-hidden
                        />
                        <span>
                          {playPhase === "device"
                            ? "Préparation…"
                            : "Relance…"}
                        </span>
                      </>
                    ) : (
                      "Relancer"
                    )}
                  </button>
                  <Link
                    href="/"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "default" }),
                      "inline-flex rounded-xl",
                    )}
                  >
                    Retour accueil
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {!revealed ? (
            <div className="flex justify-center gap-2">
              <Link
                href="/"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "rounded-lg",
                )}
              >
                Retour accueil
              </Link>
            </div>
          ) : null}
        </>
      )}

      {(playerError || msg) && (
        <p className="text-center text-sm text-destructive">
          {playerError || msg}
        </p>
      )}
    </div>
  );
}
