"use client";

import { useCallback, useEffect, useState } from "react";
import type { Card } from "@/types/card";
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
            Aperçu avant impression (plusieurs QR par page). Utilise Ctrl+P /
            Cmd+P.
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
        className="print-grid grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-4"
        data-label={labelMode}
      >
        {cards.map((c) => (
          <figure
            key={c.id}
            className="flex flex-col items-center break-inside-avoid rounded-2xl border border-dashed p-4 text-center print:border print:border-neutral-300 print:shadow-none"
          >
            <QrDisplay value={c.qr_url} size={140} className="rounded-xl" />
            {labelMode === "title" ? (
              <figcaption className="mt-3 max-w-[160px] text-xs leading-snug">
                <span className="block font-medium">{c.title}</span>
              </figcaption>
            ) : null}
          </figure>
        ))}
      </div>
    </div>
  );
}
