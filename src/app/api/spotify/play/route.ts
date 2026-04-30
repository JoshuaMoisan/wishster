import { NextResponse } from "next/server";
import { readSpotifyFromRequest } from "@/lib/spotify/cookies";
import { getValidAccessToken } from "@/lib/spotify/token";
import { attachSpotifyTokensIfNeeded } from "@/lib/spotify/attach-tokens";

function spotifyApiErrorMessage(status: number, bodyText: string): string {
  let apiMessage = "";
  try {
    const j = JSON.parse(bodyText) as {
      error?: { message?: string; reason?: string };
    };
    apiMessage = (j.error?.message || j.error?.reason || "").trim();
  } catch {
    /* ignore */
  }
  const hint = `${apiMessage} ${bodyText}`.toLowerCase();

  if (status === 404) {
    return "Spotify ne trouve pas le lecteur de cette page. Réessaie dans quelques secondes ou recharge l’onglet.";
  }
  if (status === 403) {
    if (/premium|subscription|restriction/i.test(hint)) {
      return "Spotify refuse la lecture : compte Premium requis ou morceau restreint pour ce compte.";
    }
    return "Spotify refuse la lecture (droits ou restrictions sur ce morceau).";
  }
  if (status === 401) {
    return "Session Spotify expirée : reconnecte-toi puis réessaie.";
  }
  if (status === 429) {
    return "Trop de demandes Spotify : patiente une minute puis réessaie.";
  }
  if (apiMessage) {
    return `Spotify : ${apiMessage}`;
  }
  return `La lecture a échoué (erreur ${status}). Réessaie ou ouvre le morceau dans l’app Spotify.`;
}

export async function POST(req: Request) {
  let body: { deviceId?: string; uri?: string; access_token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const deviceId = body.deviceId?.trim();
  const uri = body.uri?.trim();
  if (!deviceId || !uri) {
    return NextResponse.json(
      { error: "deviceId et uri requis" },
      { status: 400 },
    );
  }

  const prev = readSpotifyFromRequest(req);
  const resolved = await getValidAccessToken(prev);
  if (!resolved) {
    return NextResponse.json(
      { error: "Connecte-toi à Spotify d’abord" },
      { status: 401 },
    );
  }

  const bodyToken =
    typeof body.access_token === "string" ? body.access_token.trim() : "";
  const token =
    bodyToken.length >= 20 ? bodyToken : resolved.accessToken;
  const transfer = await fetch(
    `https://api.spotify.com/v1/me/player`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        device_ids: [deviceId],
        play: false,
      }),
    },
  );

  if (!transfer.ok && transfer.status !== 204) {
    const t = await transfer.text();
    return NextResponse.json(
      {
        error: spotifyApiErrorMessage(transfer.status, t),
      },
      { status: transfer.status >= 400 && transfer.status < 600 ? transfer.status : 502 },
    );
  }

  await new Promise((r) => setTimeout(r, 550));

  const play = await fetch(
    `https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(deviceId)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uris: [uri] }),
    },
  );

  if (!play.ok && play.status !== 204) {
    const t = await play.text();
    return NextResponse.json(
      { error: spotifyApiErrorMessage(play.status, t) },
      { status: play.status >= 400 && play.status < 600 ? play.status : 502 },
    );
  }

  const res = NextResponse.json({ ok: true });
  attachSpotifyTokensIfNeeded(res, req, prev, resolved);
  return res;
}
