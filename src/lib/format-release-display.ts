export type ReleasePrintDateMode = "year" | "full";

/** Année seule (AAAA), à partir de la date ISO ou de release_year. */
export function formatReleaseYearOnly(
  release_date: string | null | undefined,
  release_year: number | null | undefined,
): string | null {
  const raw = release_date?.trim();
  if (raw) {
    const isoYear = /^(\d{4})/.exec(raw);
    if (isoYear) return isoYear[1];
    const t = Date.parse(raw);
    if (!Number.isNaN(t)) return String(new Date(t).getUTCFullYear());
  }
  if (release_year != null) return String(release_year);
  return null;
}

/** Ligne date pour l’impression admin selon le mode choisi. */
export function formatReleaseForPrint(
  mode: ReleasePrintDateMode,
  release_date: string | null | undefined,
  release_year: number | null | undefined,
): string | null {
  if (mode === "year") {
    return formatReleaseYearOnly(release_date, release_year);
  }
  return formatReleaseDdMmYyyy(release_date, release_year);
}

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
