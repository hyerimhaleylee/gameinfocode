import { NextRequest, NextResponse } from "next/server";
import { getPlayerById, getMatchHistory, accumulateMatchIds } from "@/lib/pubg";

export async function GET(req: NextRequest) {
  const accountId = req.nextUrl.searchParams.get("accountId");
  const shard = req.nextUrl.searchParams.get("shard") ?? "steam";

  if (!accountId) {
    return NextResponse.json({ error: "accountId required" }, { status: 400 });
  }

  try {
    const player = await getPlayerById(accountId, shard);
    const freshIds: string[] = (player.relationships?.matches?.data ?? []).map(
      (m: { id: string }) => m.id
    );

    if (freshIds.length === 0) return NextResponse.json([]);

    // Accumulate match IDs in Redis so history grows with each visit (up to 100)
    const matchIds = await accumulateMatchIds(accountId, freshIds, 100);

    const matches = await getMatchHistory(matchIds, accountId, shard, 20);
    return NextResponse.json(matches);
  } catch {
    return NextResponse.json([]);
  }
}
