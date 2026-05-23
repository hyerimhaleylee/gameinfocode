import { NextRequest, NextResponse } from "next/server";
import { getSeasonsList } from "@/lib/pubg";

export async function GET(req: NextRequest) {
  const shard = req.nextUrl.searchParams.get("platform") ?? "steam";
  try {
    const seasons = await getSeasonsList(shard);
    return NextResponse.json(
      seasons.slice(0, 12).map((s) => ({
        id: s.id,
        label: (() => {
          const num = s.id.match(/pc-\d{4}-(\d+)/)?.[1];
          return num ? `시즌 ${parseInt(num)}` : s.id;
        })(),
        isCurrentSeason: s.attributes.isCurrentSeason,
      }))
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "시즌 조회 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
