import { NextRequest, NextResponse } from "next/server";
import { getSeasonsList } from "@/lib/pubg";

export async function GET(req: NextRequest) {
  const shard = req.nextUrl.searchParams.get("platform") ?? "steam";
  try {
    const seasons = await getSeasonsList(shard);
    return NextResponse.json(
      seasons.slice(0, 12).map((s) => ({
        id: s.id,
        label: `시즌 ${parseInt(s.id.match(/pc-2018-(\d+)/)![1])}`,
        isCurrentSeason: s.attributes.isCurrentSeason,
      }))
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "시즌 조회 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
