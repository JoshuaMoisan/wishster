"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Card } from "@/types/card";
import { QrDisplay } from "@/components/qr/qr-display";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { MoreHorizontal } from "lucide-react";

export function AdminCardsClient() {
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/cards", { credentials: "include" });
      if (!r.ok) throw new Error("Liste impossible");
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

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return cards;
    return cards.filter((c) => {
      const hay = `${c.title} ${c.artist_name} ${c.slug}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [cards, q]);

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Lien copié");
    } catch {
      toast.error("Copie impossible");
    }
  }

  async function downloadQr(slug: string, url: string) {
    const QRCode = (await import("qrcode")).default;
    const dataUrl = await QRCode.toDataURL(url, { width: 512, margin: 2 });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `wishster-${slug}.png`;
    a.click();
  }

  async function remove(id: string) {
    if (!confirm("Supprimer cette carte ?")) return;
    const r = await fetch(`/api/admin/cards/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!r.ok) {
      toast.error("Suppression impossible");
      return;
    }
    toast.success("Carte supprimée");
    void load();
  }

  function test(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  if (loading) {
    return <p className="text-muted-foreground">Chargement…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Cartes</h1>
          <p className="text-sm text-muted-foreground">
            {cards.length} carte{cards.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/admin/cards/new"
          className={cn(buttonVariants({ size: "default" }), "rounded-xl")}
        >
          Nouvelle carte
        </Link>
      </div>

      <Input
        placeholder="Rechercher titre, artiste, slug…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="max-w-md rounded-xl"
      />

      <div className="rounded-2xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">QR</TableHead>
              <TableHead>Titre</TableHead>
              <TableHead>Artiste</TableHead>
              <TableHead>Année</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="w-[70px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Aucune carte
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow
                  key={c.id}
                  tabIndex={0}
                  aria-label={`Voir ou éditer : ${c.title}`}
                  className="cursor-pointer"
                  onClick={() => router.push(`/admin/cards/${c.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`/admin/cards/${c.id}`);
                    }
                  }}
                >
                  <TableCell>
                    <QrDisplay value={c.qr_url} size={72} className="rounded-lg" />
                  </TableCell>
                  <TableCell className="font-medium">{c.title}</TableCell>
                  <TableCell>{c.artist_name}</TableCell>
                  <TableCell>
                    {c.release_year ?? (c.release_date?.slice(0, 4) ?? "—")}
                  </TableCell>
                  <TableCell className="max-w-[140px] truncate font-mono text-xs">
                    {c.slug}
                  </TableCell>
                  <TableCell
                    className="w-[70px]"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "icon" }),
                          "rounded-lg",
                        )}
                        aria-label="Actions"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem onClick={() => test(c.qr_url)}>
                          Tester
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => void copyLink(c.qr_url)}>
                          Copier le lien
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => void downloadQr(c.slug, c.qr_url)}
                        >
                          Télécharger le QR
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => void remove(c.id)}
                        >
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
