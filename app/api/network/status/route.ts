import { NextResponse } from "next/server";
import { probeNetwork } from "@/lib/infra/probe";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  const { info } = await probeNetwork();
  return NextResponse.json(info, {
    status: info.status === "verified" ? 200 : 503,
    headers: { "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff" }
  });
}
