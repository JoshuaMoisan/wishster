import { NextResponse } from "next/server";

/** Pour meta refresh : guillemets échappés dans l’URL. */
function urlForMetaRefresh(url: string): string {
  return url.replace(/'/g, "%27").replace(/"/g, "%22");
}

/** Pour attribut href. */
function htmlEscapeHref(url: string): string {
  return url
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Réponse 200 + Set-Cookie puis navigation sans script inline (souvent bloqué par la CSP).
 * Utilise meta refresh + lien manuel en secours.
 */
export function oauthNavigateResponse(
  absoluteLocation: string,
  applyCookies: (res: NextResponse) => void,
): NextResponse {
  const metaUrl = urlForMetaRefresh(absoluteLocation);
  const href = htmlEscapeHref(absoluteLocation);
  const body = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Wishster</title><meta http-equiv="refresh" content="0; url='${metaUrl}'"></head><body><p style="font-family:system-ui,sans-serif;margin:2rem">Redirection…</p><p style="font-family:system-ui,sans-serif;margin:2rem"><a href="${href}">Continuer vers Wishster</a></p></body></html>`;
  const res = new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
    },
  });
  applyCookies(res);
  return res;
}
