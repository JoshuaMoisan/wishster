"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Card } from "@/types/card";
import {
  formatReleaseForPrint,
  type ReleasePrintDateMode,
} from "@/lib/format-release-display";
import { PrintVersoFitText } from "@/components/admin/print-verso-fit-text";
import { QrDisplay } from "@/components/qr/qr-display";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type LabelMode = "title" | "none";

/** Nombre de paires recto+verso par page A4 à l’impression. */
const PAIRS_PER_PRINT_SHEET = 3;

export function AdminPrintClient() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [labelMode, setLabelMode] = useState<LabelMode>("none");
  const [dateFormat, setDateFormat] = useState<ReleasePrintDateMode>("year");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/cards", { credentials: "include" });
      if (!r.ok) throw new Error("Chargement impossible");
      const j = (await r.json()) as { cards: Card[] };
      setCards(j.cards ?? []);
    } catch {
      toast.error("Impossible de charger les cartes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <p className="text-muted-foreground">Chargement…</p>;
  }

  const printSheets = useMemo(() => {
    const out: Card[][] = [];
    for (let i = 0; i < cards.length; i += PAIRS_PER_PRINT_SHEET) {
      out.push(cards.slice(i, i + PAIRS_PER_PRINT_SHEET));
    }
    return out;
  }, [cards]);

  return (
    <div>
      <div className="no-print mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Impression</h1>
        <div className="mt-4 flex max-w-2xl flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Libellé sous QR :
            </span>
            <Button
              type="button"
              size="sm"
              variant={labelMode === "title" ? "default" : "outline"}
              className="rounded-lg"
              onClick={() => setLabelMode("title")}
            >
              Titre
            </Button>
            <Button
              type="button"
              size="sm"
              variant={labelMode === "none" ? "default" : "outline"}
              className="rounded-lg"
              onClick={() => setLabelMode("none")}
            >
              Aucun
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Date au verso :</span>
            <Button
              type="button"
              size="sm"
              variant={dateFormat === "year" ? "default" : "outline"}
              className="rounded-lg"
              onClick={() => setDateFormat("year")}
            >
              Année
            </Button>
            <Button
              type="button"
              size="sm"
              variant={dateFormat === "full" ? "default" : "outline"}
              className="rounded-lg"
              onClick={() => setDateFormat("full")}
            >
              JJ/MM/AAAA
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="rounded-lg"
              onClick={() => window.print()}
            >
              Imprimer
            </Button>
          </div>
        </div>
        <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
          Recto (QR) et verso (titre, artiste, date). Faces 63 × 88 mm, marges
          page à 0 et paires jointives pour tenir {PAIRS_PER_PRINT_SHEET} paires
          sur une A4. Impression à{" "}
          <span className="font-medium text-foreground">100 %</span>, sans
          « Ajuster à la page », et si possible{" "}
          <span className="font-medium text-foreground">
            en-têtes / pieds désactivés
          </span>{" "}
          dans la boîte d’impression (sinon le navigateur mange de la hauteur).
          Ctrl+P / Cmd+P.
        </p>
      </div>

      <div
        className="print-grid grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-8 lg:grid-cols-2 xl:grid-cols-3"
        data-label={labelMode}
        data-date-format={dateFormat}
      >
        {printSheets.map((sheet, sheetIdx) => (
          <div
            key={`sheet-${sheetIdx}-${sheet[0]?.id ?? "e"}`}
            className="print-sheet flex flex-col items-center gap-8 sm:gap-6"
          >
            {sheet.map((c) => {
              const releaseLine = formatReleaseForPrint(
                dateFormat,
                c.release_date,
                c.release_year,
              );
              const panelFace =
                "print-card-face aspect-[63/88] min-h-0 w-full max-w-full shrink-0 overflow-hidden [container-type:size] flex flex-col items-center justify-center rounded-2xl border border-dashed p-2 text-center print:border print:border-neutral-300 print:shadow-none sm:p-3 print:box-border";
              const qrSize = labelMode === "title" ? 88 : 108;
              return (
                <div
                  key={c.id}
                  className="min-w-0 w-full max-w-full print:break-inside-auto"
                >
                  <div className="print-card-pair mx-auto grid w-full min-w-0 max-w-full grid-cols-2 items-start gap-3 [grid-template-columns:repeat(2,minmax(0,1fr))] sm:gap-4 print:w-fit print:max-w-none">
                    <figure className={`${panelFace} gap-1 sm:gap-2`}>
                      <QrDisplay
                        value={c.qr_url}
                        size={qrSize}
                        className="max-h-[68%] max-w-[88%] shrink-0 rounded-lg object-contain print:max-h-[64%] print:max-w-[86%]"
                      />
                      {labelMode === "title" ? (
                        <figcaption className="line-clamp-3 max-w-[95%] min-w-0 px-0.5 font-medium leading-tight [font-size:clamp(0.55rem,7.5cqw,0.78rem)]">
                          {c.title}
                        </figcaption>
                      ) : null}
                    </figure>
                    <div className={panelFace} aria-label="Verso carte">
                      <PrintVersoFitText
                        key={c.id}
                        title={c.title}
                        artist={c.artist_name}
                        releaseLine={releaseLine}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
