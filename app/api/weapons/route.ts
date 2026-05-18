import { NextRequest, NextResponse } from "next/server";
import { getWeaponStats, getWeaponMastery } from "@/lib/pubg";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const accountId = req.nextUrl.searchParams.get("accountId");
  const shard = req.nextUrl.searchParams.get("shard") ?? "steam";

  if (!accountId) {
    return NextResponse.json({ error: "accountId가 필요합니다." }, { status: 400 });
  }

  const [telemetryResult, masteryResult] = await Promise.allSettled([
    getWeaponStats(accountId, shard),
    getWeaponMastery(accountId, shard),
  ]);

  const telemetry = telemetryResult.status === "fulfilled" ? telemetryResult.value : null;
  const mastery = masteryResult.status === "fulfilled" ? masteryResult.value : null;

  if (!telemetry && !mastery) {
    return NextResponse.json({ error: "무기 데이터 조회 실패" }, { status: 500 });
  }

  return NextResponse.json({ telemetry, mastery });
}
