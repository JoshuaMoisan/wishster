"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AdminLoginForm() {
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });
      const text = await r.text();
      let j: { error?: string; code?: string } = {};
      try {
        j = JSON.parse(text) as typeof j;
      } catch {
        setErr(
          r.status >= 500
            ? `Erreur serveur (${r.status}). Regarde le terminal du serveur Next.js.`
            : "Réponse invalide du serveur",
        );
        return;
      }
      if (!r.ok) {
        setErr(j.error ?? `Erreur ${r.status}`);
        return;
      }
      // Navigation complète pour que le cookie httpOnly soit bien pris en compte par la suite.
      window.location.assign("/admin/cards");
    } catch {
      setErr("Réseau indisponible");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="rounded-2xl border shadow-sm">
      <CardHeader>
        <CardTitle>Connexion</CardTitle>
        <CardDescription>
          Le mot de passe est défini dans{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            ADMIN_PASSWORD
          </code>
          .
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-pw">Mot de passe</Label>
            <Input
              id="admin-pw"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl"
              required
            />
          </div>
          {err ? (
            <p className="text-sm text-destructive" role="alert">
              {err}
            </p>
          ) : null}
          <Button
            type="submit"
            className="w-full rounded-xl"
            disabled={loading}
          >
            {loading ? "Connexion…" : "Entrer"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
