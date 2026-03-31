import { NextResponse } from "next/server";
import { clearSpotifyCookies } from "@/lib/spotify/cookies";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  clearSpotifyCookies(res);
  return res;
}
