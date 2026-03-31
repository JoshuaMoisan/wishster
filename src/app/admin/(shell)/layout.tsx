import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE_NAME,
  verifyAdminSessionToken,
} from "@/lib/admin-session";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { logoutAdmin } from "./logout-action";

export default async function AdminShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const c = await cookies();
  const t = c.get(ADMIN_COOKIE_NAME)?.value;
  if (!verifyAdminSessionToken(t)) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="no-print sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <Link
            href="/admin/cards"
            className="text-lg font-semibold tracking-tight"
          >
            Wishster Admin
          </Link>
          <nav className="flex flex-wrap items-center gap-2">
            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "rounded-lg",
              )}
            >
              Accueil
            </Link>
            <Link
              href="/admin/cards"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "rounded-lg",
              )}
            >
              Cartes
            </Link>
            <Link
              href="/admin/cards/new"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "rounded-lg",
              )}
            >
              Nouvelle carte
            </Link>
            <Link
              href="/admin/print"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "rounded-lg",
              )}
            >
              Impression
            </Link>
            <form action={logoutAdmin}>
              <button
                type="submit"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "rounded-lg",
                )}
              >
                Déconnexion admin
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
