"use client";

import { useCallback, useRef, useState } from "react";
import type { SpotifyWebPlaybackPlayer } from "@/types/spotify";

type Status =
  | "idle"
  | "loading_script"
  | "initializing"
  | "ready"
  | "error";

function loadSpotifyScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("window indisponible"));
  }
  if (window.Spotify) return Promise.resolve();

  return new Promise((resolve, reject) => {
    if (document.querySelector("script[data-wishster-spotify-sdk]")) {
      const t0 = Date.now();
      const id = window.setInterval(() => {
        if (window.Spotify) {
          window.clearInterval(id);
          resolve();
        } else if (Date.now() - t0 > 15000) {
          window.clearInterval(id);
          reject(new Error("Timeout SDK Spotify"));
        }
      }, 50);
      return;
    }

    const w = window as Window & { onSpotifyWebPlaybackSDKReady?: () => void };
    w.onSpotifyWebPlaybackSDKReady = () => resolve();
    const s = document.createElement("script");
    s.src = "https://sdk.scdn.co/spotify-player.js";
    s.async = true;
    s.setAttribute("data-wishster-spotify-sdk", "1");
    s.onerror = () => reject(new Error("Chargement SDK échoué"));
    document.body.appendChild(s);
  });
}

export function useSpotifyWebPlayer() {
  const [status, setStatus] = useState<Status>("idle");
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const playerRef = useRef<SpotifyWebPlaybackPlayer | null>(null);
  const deviceIdRef = useRef<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const disconnect = useCallback(() => {
    try {
      playerRef.current?.disconnect();
    } catch {
      /* ignore */
    }
    playerRef.current = null;
    deviceIdRef.current = null;
    setDeviceId(null);
    setStatus("idle");
    setError(null);
  }, []);

  const connectPlayer = useCallback(async () => {
    if (playerRef.current && deviceIdRef.current) {
      return;
    }

    setError(null);
    setStatus("loading_script");
    await loadSpotifyScript();

    const Spotify = window.Spotify;
    if (!Spotify) {
      const m = "SDK non disponible";
      setError(m);
      setStatus("error");
      throw new Error(m);
    }

    if (playerRef.current) {
      try {
        playerRef.current.disconnect();
      } catch {
        /* ignore */
      }
      playerRef.current = null;
      deviceIdRef.current = null;
      setDeviceId(null);
    }

    setStatus("initializing");

    const player = new Spotify.Player({
      name: "Wishster",
      getOAuthToken: (cb) => {
        void (async () => {
          try {
            const r = await fetch("/api/spotify/player-token", {
              credentials: "include",
            });
            const j = (await r.json()) as { access_token?: string };
            cb(j.access_token ?? "");
          } catch {
            cb("");
          }
        })();
      },
      volume: 0.92,
    });
    playerRef.current = player;

    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(() => {
        reject(new Error("Délai dépassé pour le lecteur Spotify"));
      }, 25000);

      let settled = false;
      const finish = (fn: () => void) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        fn();
      };

      const fail = (msg: string) => {
        setError(msg);
        setStatus("error");
        finish(() => reject(new Error(msg)));
      };

      player.addListener("initialization_error", (arg) => {
        const e = arg as { message?: string };
        fail(String(e.message ?? "Erreur d’initialisation"));
      });
      player.addListener("authentication_error", (arg) => {
        const e = arg as { message?: string };
        fail(String(e.message ?? "Authentification Spotify refusée"));
      });
      player.addListener("account_error", (arg) => {
        const e = arg as { message?: string };
        fail(
          String(e.message) ||
            "Premium Spotify requis pour la lecture dans le navigateur.",
        );
      });
      player.addListener("playback_error", (arg) => {
        const e = arg as { message?: string };
        setError(String(e.message ?? "Erreur de lecture"));
      });

      player.addListener("ready", (arg) => {
        const e = arg as { device_id: string };
        deviceIdRef.current = e.device_id;
        setDeviceId(e.device_id);
        setStatus("ready");
        setError(null);
        void (async () => {
          await new Promise((r) => setTimeout(r, 1200));
          finish(() => resolve());
        })();
      });

      player.addListener("not_ready", () => {
        deviceIdRef.current = null;
        setDeviceId(null);
      });

      void player.connect().then((ok) => {
        if (!ok) fail("Connexion au lecteur refusée");
      });
    });
  }, []);

  const playUri = useCallback(async (uri: string) => {
    const id = deviceIdRef.current;
    if (!id) throw new Error("Lecteur non prêt");

    async function fetchPlayerAccessToken(): Promise<string> {
      const tokenRes = await fetch("/api/spotify/player-token", {
        credentials: "include",
      });
      if (!tokenRes.ok) {
        throw new Error("Reconnecte-toi à Spotify.");
      }
      const j = (await tokenRes.json()) as { access_token?: string };
      const at = j.access_token?.trim();
      if (!at) throw new Error("Jeton Spotify indisponible.");
      return at;
    }

    const postPlay = async (access_token: string) => {
      const r = await fetch("/api/spotify/play", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: id, uri, access_token }),
      });
      const j = (await r.json()) as { error?: string };
      if (!r.ok) throw new Error(j.error || "Lecture impossible");
    };

    let lastErr: Error = new Error("Lecture impossible");
    for (let attempt = 0; attempt < 4; attempt++) {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, 700 + attempt * 350));
      }
      try {
        const access_token = await fetchPlayerAccessToken();
        await postPlay(access_token);
        return;
      } catch (e) {
        lastErr = e instanceof Error ? e : new Error(String(e));
        const msg = lastErr.message;
        const retryable =
          /401|Non connecté|Connecte-toi/i.test(msg) === false &&
          /scope|Scope|403|404|502|503|Transfert|Lecture impossible|device|Device|active|No active|restriction|Premium|premium/i.test(
            msg,
          );
        if (!retryable) throw lastErr;
      }
    }
    throw lastErr;
  }, []);

  const getState = useCallback(async () => {
    const p = playerRef.current;
    if (!p) return null;
    return p.getCurrentState();
  }, []);

  const pause = useCallback(async () => {
    await playerRef.current?.pause();
  }, []);

  const resume = useCallback(async () => {
    await playerRef.current?.resume();
  }, []);

  const seek = useCallback(async (ms: number) => {
    await playerRef.current?.seek(ms);
  }, []);

  return {
    status,
    deviceId,
    error,
    clearError,
    connectPlayer,
    playUri,
    getState,
    pause,
    resume,
    seek,
    disconnect,
  };
}
