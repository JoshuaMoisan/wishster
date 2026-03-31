export function getPublicAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (!url) throw new Error("NEXT_PUBLIC_APP_URL is not set");
  return url;
}

export function playUrlForSlug(slug: string): string {
  return `${getPublicAppUrl()}/play/${encodeURIComponent(slug)}`;
}
