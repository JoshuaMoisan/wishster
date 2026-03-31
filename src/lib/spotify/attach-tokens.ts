import type { NextResponse } from "next/server";
import {
  cookieSecureFromRequest,
  setSpotifyTokens,
} from "./cookies";
import type { SpotifyCookieValues } from "./cookies";
import type { ResolvedSpotifyToken } from "./token";

export function attachSpotifyTokensIfNeeded(
  res: NextResponse,
  req: Request,
  prev: SpotifyCookieValues,
  resolved: ResolvedSpotifyToken,
) {
  if (!resolved.didRefresh) return;
  const refresh = resolved.rotatedRefresh ?? prev.refresh ?? "";
  if (!refresh) return;
  setSpotifyTokens(
    res,
    resolved.accessToken,
    refresh,
    resolved.expiresInSec,
    cookieSecureFromRequest(req),
  );
}
