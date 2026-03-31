"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME } from "@/lib/admin-session";

export async function logoutAdmin() {
  (await cookies()).delete(ADMIN_COOKIE_NAME);
  redirect("/admin/login");
}
