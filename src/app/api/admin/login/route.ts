import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_MAX_AGE,
  ADMIN_COOKIE_NAME,
  createAdminSessionToken,
  getAdminAuthConfigError,
  verifyAdminPassword,
} from "@/lib/admin-session";
import { cookieSecureFromRequest } from "@/lib/spotify/cookies";

export async function POST(req: Request) {
  const secure = cookieSecureFromRequest(req);
  const configErr = getAdminAuthConfigError();
  if (configErr) {
    return NextResponse.json({ error: configErr, code: "admin_config" }, { status: 503 });
  }

  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const password = body.password ?? "";
  if (!verifyAdminPassword(password)) {
    return NextResponse.json(
      {
        error:
          "Mot de passe incorrect. Vérifie ADMIN_PASSWORD dans .env.local (sans guillemets, redémarre npm run dev après modification).",
        code: "bad_password",
      },
      { status: 401 },
    );
  }

  let token: string;
  try {
    token = createAdminSessionToken();
  } catch {
    return NextResponse.json(
      {
        error:
          "Impossible de créer la session (ADMIN_SESSION_SECRET). Redémarre le serveur après avoir rempli .env.local.",
        code: "token_error",
      },
      { status: 500 },
    );
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: ADMIN_COOKIE_MAX_AGE,
  });
  return res;
}
