import { NextRequest, NextResponse } from "next/server";
import { findPlayer, getCurrentSeason, getSeasonStats } from "@/lib/pubg";
import {
  extractBestModeStats,
  processStats,
  determinePersona,
  generateInsights,
  generateRecommendation,
  calculateRadarValues,
} from "@/lib/persona";

// PUBG API is case-sensitive. Try original, uppercase, and lowercase across steam+kakao in parallel.
async function resolvePlayer(name: string) {
  const variants = Array.from(new Set([name, name.toUpperCase(), name.toLowerCase()]));
  const shards = ["steam", "kakao"];

  const attempts = variants.flatMap((v) => shards.map((s) => ({ name: v, shard: s })));

  const results = await Promise.allSettled(
    attempts.map(({ name: n, shard: s }) => findPlayer(n, s).then((p) => ({ player: p, shard: s })))
  );

  const found = results.find((r) => r.status === "fulfilled");
  if (found && found.status === "fulfilled") return found.value;

  throw new Error("플레이어를 찾을 수 없습니다. 닉네임을 확인해주세요.");
}

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name");

  if (!name) {
    return NextResponse.json({ error: "닉네임을 입력해주세요." }, { status: 400 });
  }

  try {
    const { player, shard } = await resolvePlayer(name);
    const season = await getCurrentSeason(shard);
    const seasonData = await getSeasonStats(player.id, season.id, shard);
    const gameModeStats = seasonData.data.attributes.gameModeStats;

    const rawStats = extractBestModeStats(gameModeStats);
    const stats = processStats(player.attributes.name, rawStats);
    const persona = determinePersona(stats);
    const insights = generateInsights(stats);
    const recommendation = generateRecommendation(stats);
    const radarValues = calculateRadarValues(stats);

    return NextResponse.json({
      name: stats.name,
      kd: stats.kdStr,
      winRate: stats.winRateStr,
      avgDamage: stats.avgDamageStr,
      headshot: stats.headshotStr,
      games: stats.gamesStr,
      persona,
      radarValues,
      insights,
      recommendation,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "분석 중 오류가 발생했습니다.";
    const status = message.includes("찾을 수 없") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
