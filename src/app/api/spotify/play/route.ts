import { NextResponse } from "next/server";
import { readSpotifyFromRequest } from "@/lib/spotify/cookies";
import { getValidAccessToken } from "@/lib/spotify/token";
import { attachSpotifyTokensIfNeeded } from "@/lib/spotify/attach-tokens";

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
      { error: `Transfert impossible: ${transfer.status} ${t}` },
      { status: 502 },
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
      { error: `Lecture impossible: ${play.status} ${t}` },
      { status: 502 },
    );
  }

  const res = NextResponse.json({ ok: true });
  attachSpotifyTokensIfNeeded(res, req, prev, resolved);
  return res;
}
