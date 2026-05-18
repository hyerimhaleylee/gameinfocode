import { NextRequest, NextResponse } from "next/server";
import { getWeaponStats } from "@/lib/pubg";

export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const accountId = req.nextUrl.searchParams.get("accountId");
  const shard = req.nextUrl.searchParams.get("shard") ?? "steam";

  if (!accountId) {
    return NextResponse.json({ error: "accountId가 필요합니다." }, { status: 400 });
  }

  try {
    const stats = await getWeaponStats(accountId, shard);
    return NextResponse.json(stats);
  } catch (err) {
    const message = err instanceof Error ? err.message : "무기 분석 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
