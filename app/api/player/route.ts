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

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name");
  const platform = req.nextUrl.searchParams.get("platform") ?? "steam";

  if (!name) {
    return NextResponse.json({ error: "닉네임을 입력해주세요." }, { status: 400 });
  }

  try {
    // Fetch player info and current season in parallel
    const [player, season] = await Promise.all([
      findPlayer(name, platform),
      getCurrentSeason(platform),
    ]);

    // Fetch season stats
    const seasonData = await getSeasonStats(player.id, season.id, platform);
    const gameModeStats = seasonData.data.attributes.gameModeStats;

    // Process
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
