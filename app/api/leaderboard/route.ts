import { NextRequest, NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/pubg";

export const dynamic = "force-dynamic";

const VALID_MODES = ["squad-fpp", "squad", "duo-fpp", "duo", "solo-fpp", "solo"];

export async function GET(req: NextRequest) {
  const season = req.nextUrl.searchParams.get("season");
  const mode = req.nextUrl.searchParams.get("mode") ?? "squad-fpp";

  if (!season) return NextResponse.json({ error: "시즌을 지정해주세요." }, { status: 400 });
  if (!VALID_MODES.includes(mode)) return NextResponse.json({ error: "유효하지 않은 모드입니다." }, { status: 400 });

  try {
    const entries = await getLeaderboard(season, mode, "pc-as");
    return NextResponse.json(entries, {
      headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=7200" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "리더보드 조회 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
