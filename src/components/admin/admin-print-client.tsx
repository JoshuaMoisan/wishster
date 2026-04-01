"use client";

import { useCallback, useEffect, useState } from "react";
import type { Card } from "@/types/card";
import { formatReleaseDdMmYyyy } from "@/lib/format-release-display";
import { PrintVersoFitText } from "@/components/admin/print-verso-fit-text";
import { QrDisplay } from "@/components/qr/qr-display";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type LabelMode = "title" | "none";

export function AdminPrintClient() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [labelMode, setLabelMode] = useState<LabelMode>("title");

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

  return (
    <div>
      <div className="no-print mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Impression</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Chaque carte : recto (QR) et verso (titre, artiste, date). Utilise
            Ctrl+P / Cmd+P.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Libellé sous QR :</span>
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

      <div
        className="print-grid grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3"
        data-label={labelMode}
      >
        {cards.map((c) => {
          const releaseLine = formatReleaseDdMmYyyy(
            c.release_date,
            c.release_year,
          );
          const panelSquare =
            "aspect-square min-h-0 w-full max-w-full overflow-hidden [container-type:size] flex flex-col items-center justify-center rounded-2xl border border-dashed p-2 text-center print:border print:border-neutral-300 print:shadow-none sm:p-3";
          const qrSize = labelMode === "title" ? 158 : 192;
          return (
            <div
              key={c.id}
              className="min-w-0 w-full max-w-full break-inside-avoid"
            >
              <div className="grid w-full min-w-0 grid-cols-2 items-start gap-3 [grid-template-columns:repeat(2,minmax(0,1fr))] sm:gap-4">
                <figure className={`${panelSquare} gap-1 sm:gap-2`}>
                  <QrDisplay
                    value={c.qr_url}
                    size={qrSize}
                    className="max-h-[78%] max-w-[78%] shrink-0 rounded-xl object-contain"
                  />
                  {labelMode === "title" ? (
                    <figcaption className="line-clamp-3 max-w-[95%] min-w-0 px-0.5 font-medium leading-tight [font-size:clamp(0.7rem,11cqw,1.125rem)]">
                      {c.title}
                    </figcaption>
                  ) : null}
                </figure>
                <div className={panelSquare} aria-label="Verso carte">
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
    </div>
  );
}
