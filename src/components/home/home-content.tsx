"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { spotifyLoginUrl } from "@/lib/spotify-login-url";

const spotifyErrorMessages: Record<string, string> = {
  invalid_state:
    "La connexion Spotify a échoué (étape de sécurité). Réessaie : si ton redirect Spotify utilise 127.0.0.1, ouvre l’app avec http://127.0.0.1:3000 — pas localhost. Tu peux aussi cliquer à nouveau sur « Se connecter » : tu seras redirigé automatiquement vers le bon hôte.",
  token_exchange:
    "Spotify n’a pas accepté l’échange de jetons (redirect URI, secret client ou code expiré). Vérifie .env.local et le dashboard Spotify.",
  missing_refresh_token:
    "Spotify n’a pas renvoyé de refresh token. Sur https://www.spotify.com/account/apps/ retire l’accès à l’app puis reconnecte-toi.",
};

export function HomeContent({ spotifyError }: { spotifyError?: string }) {
  const [session, setSession] = useState<{
    connected: boolean;
    product?: string;
  } | null>(null);

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

  async function logoutSpotify() {
    await fetch("/api/spotify/logout", {
      method: "POST",
      credentials: "include",
    });
    setSession({ connected: false });
  }

  if (session === null) {
    return (
      <div className="relative flex min-h-[100dvh] flex-1 flex-col items-center justify-center bg-background px-4">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,oklch(0.72_0.16_48/0.28),transparent_58%)]"
          aria-hidden
        />
        <p className="font-game text-lg tracking-wide text-primary">Chargement…</p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-1 flex-col items-center overflow-x-hidden bg-gradient-to-b from-background via-background to-accent/30 px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-10%,oklch(0.78_0.14_52/0.35),transparent_50%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 h-40 w-[120%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,oklch(0.65_0.18_48/0.12),transparent_70%)]"
        aria-hidden
      />

      <div className="relative z-[1] flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-8">
        {spotifyError ? (
          <div
            role="alert"
            className="w-full rounded-2xl border-2 border-destructive/40 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive"
          >
            {spotifyErrorMessages[spotifyError] ??
              `Erreur Spotify (${spotifyError}). Réessaie la connexion.`}
          </div>
        ) : null}

        <header className="flex flex-col items-center gap-4 text-center">
          <p className="font-game text-[0.65rem] font-normal uppercase tracking-[0.35em] text-primary/70 sm:text-xs">
            Jeu musical
          </p>
          <h1
            className={cn(
              "font-game text-5xl leading-none tracking-tight text-primary drop-shadow-[0_3px_0_oklch(0.45_0.15_42/0.35)] sm:text-6xl",
            )}
          >
            Wishster
          </h1>
          <p className="text-balance text-sm leading-relaxed text-muted-foreground">
            Scanne une carte QR, écoute le morceau, devine… puis révèle la
            réponse.
          </p>
          <ul className="flex flex-wrap justify-center gap-2">
            {["Écoute", "Devine", "Révèle"].map((label) => (
              <li
                key={label}
                className="rounded-full border-2 border-primary/25 bg-card/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary"
              >
                {label}
              </li>
            ))}
          </ul>
        </header>

        {!session.connected ? (
          <div className="flex w-full flex-col items-stretch gap-4">
            <div className="rounded-3xl border-4 border-primary/20 bg-card/90 p-5 text-center shadow-[0_6px_0_oklch(0.55_0.14_48/0.2)] backdrop-blur-sm">
              <p className="text-sm text-muted-foreground">
                Connecte Spotify pour gérer tes cartes et jouer dans le
                navigateur (Premium pour la lecture web).
              </p>
            </div>
            <a
              href={spotifyLoginUrl("/")}
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-14 w-full rounded-2xl text-base font-semibold shadow-[0_5px_0_oklch(0.42_0.14_42/0.45)] transition-transform active:translate-y-0.5 active:shadow-none",
              )}
            >
              Se connecter à Spotify
            </a>
          </div>
        ) : (
          <div className="flex w-full flex-col items-stretch gap-5">
            <div className="rounded-3xl border-4 border-primary/25 bg-card/95 p-6 text-center shadow-[0_8px_0_oklch(0.52_0.12_48/0.22)] backdrop-blur-sm">
              <p className="font-game text-xs uppercase tracking-[0.2em] text-primary/80">
                Zone créateur
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Cartes, QR et impression — accès admin protégé par mot de
                passe.
              </p>
            </div>

            <nav className="flex w-full flex-col gap-3" aria-label="Administration">
              <Link
                href="/admin/cards"
                className={cn(
                  buttonVariants({ variant: "secondary", size: "lg" }),
                  "h-14 w-full justify-center rounded-2xl border-2 border-primary/15 text-base font-semibold",
                )}
              >
                Mes cartes
              </Link>
              <Link
                href="/admin/cards/new"
                className={cn(
                  buttonVariants({ variant: "secondary", size: "lg" }),
                  "h-14 w-full justify-center rounded-2xl border-2 border-primary/15 text-base font-semibold",
                )}
              >
                Nouvelle carte
              </Link>
              <Link
                href="/admin/print"
                className={cn(
                  buttonVariants({ variant: "secondary", size: "lg" }),
                  "h-14 w-full justify-center rounded-2xl border-2 border-primary/15 text-base font-semibold",
                )}
              >
                Impression QR
              </Link>
            </nav>

            <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 px-4 py-4 text-center">
              <p className="font-game text-sm text-primary">Prêt à jouer ?</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Scanne une carte avec ton téléphone pour lancer une partie.
              </p>
            </div>

            <button
              type="button"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "mx-auto text-muted-foreground",
              )}
              onClick={() => void logoutSpotify()}
            >
              Déconnexion Spotify
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
