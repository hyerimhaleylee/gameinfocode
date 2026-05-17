import { NextRequest, NextResponse } from "next/server";
import { getPlayerById, getMatchHistory } from "@/lib/pubg";

export async function GET(req: NextRequest) {
  const accountId = req.nextUrl.searchParams.get("accountId");
  const shard = req.nextUrl.searchParams.get("shard") ?? "steam";

  if (!accountId) {
    return NextResponse.json({ error: "accountId required" }, { status: 400 });
  }

  try {
    const player = await getPlayerById(accountId, shard);
    const matchIds: string[] = (player.relationships?.matches?.data ?? []).map(
      (m: { id: string }) => m.id
    );

    if (matchIds.length === 0) return NextResponse.json([]);

    const matches = await getMatchHistory(matchIds, accountId, shard, 20);
    return NextResponse.json(matches);
  } catch {
    return NextResponse.json([]);
  }
}
