import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";

const COOKIE = "wishster_admin";
const MAX_AGE_SEC = 60 * 60 * 24 * 7;

function trimEnv(v: string | undefined): string {
  return (v ?? "").trim().replace(/\r$/, "");
}

function sessionSecret(): string | null {
  const s = trimEnv(process.env.ADMIN_SESSION_SECRET);
  return s.length > 0 ? s : null;
}

export function getAdminAuthConfigError(): string | null {
  const missing: string[] = [];
  if (!trimEnv(process.env.ADMIN_PASSWORD)) missing.push("ADMIN_PASSWORD");
  if (!sessionSecret()) missing.push("ADMIN_SESSION_SECRET");
  if (missing.length === 0) return null;
  return `Variables manquantes ou vides : ${missing.join(", ")}. Complète ton fichier .env.local puis redémarre le serveur (npm run dev).`;
}

export function createAdminSessionToken(): string {
  const secret = sessionSecret();
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET is not set");
  }
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC;
  const payload = JSON.stringify({ exp, v: 1 });
  const sig = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
  return `${Buffer.from(payload, "utf8").toString("base64url")}.${sig}`;
}

export function verifyAdminSessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const secret = sessionSecret();
  if (!secret) return false;
  try {
    const dot = token.lastIndexOf(".");
    if (dot <= 0) return false;
    const payloadB64 = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const payload = Buffer.from(payloadB64, "base64url").toString("utf8");
    const expected = createHmac("sha256", secret)
      .update(payload)
      .digest("base64url");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
    const { exp } = JSON.parse(payload) as { exp: number };
    return typeof exp === "number" && exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function verifyAdminPassword(pw: string): boolean {
  const expected = trimEnv(process.env.ADMIN_PASSWORD);
  if (!expected) return false;
  const a = Buffer.from(pw, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export const ADMIN_COOKIE_NAME = COOKIE;
export const ADMIN_COOKIE_MAX_AGE = MAX_AGE_SEC;

export function randomOAuthState(): string {
  return randomBytes(16).toString("hex");
}
