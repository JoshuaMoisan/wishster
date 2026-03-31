/** URL de jeu côté client (NEXT_PUBLIC_APP_URL ou origine courante). */
export function playUrlClient(slug: string): string {
  const base =
    (typeof process !== "undefined" &&
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "")) ||
    (typeof window !== "undefined" ? window.location.origin : "");
  if (!base) return `/play/${encodeURIComponent(slug)}`;
  return `${base}/play/${encodeURIComponent(slug)}`;
}
