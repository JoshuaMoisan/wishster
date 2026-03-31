/** Affichage JJ/MM/AAAA pour la révélation (données carte / Spotify). */
export function formatReleaseDdMmYyyy(
  release_date: string | null | undefined,
  release_year: number | null | undefined,
): string | null {
  const raw = release_date?.trim();
  if (raw) {
    const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
    if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
    const t = Date.parse(raw);
    if (!Number.isNaN(t)) {
      const d = new Date(t);
      const dd = String(d.getUTCDate()).padStart(2, "0");
      const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
      const yyyy = String(d.getUTCFullYear());
      return `${dd}/${mm}/${yyyy}`;
    }
  }
  if (release_year != null) return `01/01/${release_year}`;
  return null;
}
