import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE_NAME,
  getAdminAuthConfigError,
  verifyAdminSessionToken,
} from "@/lib/admin-session";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export default async function AdminLoginPage() {
  const c = await cookies();
  const t = c.get(ADMIN_COOKIE_NAME)?.value;
  if (verifyAdminSessionToken(t)) {
    redirect("/admin/cards");
  }
  const configErr = getAdminAuthConfigError();
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Admin Wishster</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Accès réservé — saisis le mot de passe configuré sur le serveur.
        </p>
      </div>
      {configErr ? (
        <div
          role="alert"
          className="mb-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100"
        >
          {configErr}
        </div>
      ) : null}
      <AdminLoginForm />
    </div>
  );
}
