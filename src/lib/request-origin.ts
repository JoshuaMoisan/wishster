/** Origine publique de la requête (Host réel du navigateur / reverse proxy). */
export function getRequestOrigin(req: Request): string {
  const url = new URL(req.url);
  const xfHost = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const xfProto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (xfHost && xfProto) return `${xfProto}://${xfHost}`;
  if (xfHost) return `${url.protocol}//${xfHost}`;
  return url.origin;
}
