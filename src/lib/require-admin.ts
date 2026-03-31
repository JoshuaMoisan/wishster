import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from "./admin-session";

export function getAdminTokenFromRequest(req: Request): string | undefined {
  const raw = req.headers.get("cookie") ?? "";
  for (const part of raw.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === ADMIN_COOKIE_NAME) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}

export function requireAdmin(req: Request): Response | null {
  const t = getAdminTokenFromRequest(req);
  if (!verifyAdminSessionToken(t)) {
    return new Response(JSON.stringify({ error: "Non autorisé" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return null;
}
