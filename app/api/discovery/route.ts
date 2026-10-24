import { NextResponse } from "next/server";
import { getVerifiedContext, MarketsUnavailable } from "@/lib/phase2/indexed";
import { buildDiscovery } from "@/lib/phase2/discovery";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const data = await buildDiscovery(await getVerifiedContext());
    return NextResponse.json(data, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return NextResponse.json({
      status: "unavailable", reason: error instanceof MarketsUnavailable ? error.reason : "Unable to verify sandbox token markets.",
      tokens: [], pools: [], referenceUsd: null, volumeUsd: null
    }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }
}
