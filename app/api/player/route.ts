import { NextRequest, NextResponse } from "next/server";
import { findPlayer, getSeasonStats, getLifetimeStats } from "@/lib/pubg";
import {
  extractBestModeStats,
  processStats,
  determinePersona,
  generateInsights,
  generateRecommendation,
  calculateRadarValues,
} from "@/lib/persona";
import type { RawModeStats } from "@/lib/persona";

// Try name variants sequentially (steam first, then kakao) — max 2 API calls for most players.
async function resolvePlayer(name: string) {
  const variants = [...new Set([name, name.toUpperCase(), name.toLowerCase()])];

  for (const variant of variants) {
    try {
      const player = await findPlayer(variant, "steam");
      return { player, shard: "steam" };
    } catch (e) {
      if (e instanceof Error && e.message !== "NOT_FOUND") throw e;
    }
  }
  for (const variant of variants) {
    try {
      const player = await findPlayer(variant, "kakao");
      return { player, shard: "kakao" };
    } catch (e) {
      if (e instanceof Error && e.message !== "NOT_FOUND") throw e;
    }
  }
  throw new Error("플레이어를 찾을 수 없습니다. 닉네임을 확인해주세요.");
}

function parseSeasonLabel(seasonId: string) {
  const num = seasonId.match(/pc-2018-(\d+)/)?.[1];
  return num ? `시즌 ${parseInt(num)}` : seasonId;
}

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name");
  // season param: omit or "lifetime" → lifetime stats
  //               specific season ID → that season (ID already known by client)
  const seasonParam = req.nextUrl.searchParams.get("season");

  if (!name) {
    return NextResponse.json({ error: "닉네임을 입력해주세요." }, { status: 400 });
  }

  try {
    const { player, shard } = await resolvePlayer(name);

    let gameModeStats: Record<string, RawModeStats>;
    let seasonId: string;
    let seasonLabel: string;

    if (seasonParam && seasonParam !== "lifetime") {
      // Specific season — client already knows the ID, no extra lookup needed
      const data = await getSeasonStats(player.id, seasonParam, shard);
      gameModeStats = data.data.attributes.gameModeStats;

      const totalGames = Object.values(gameModeStats).reduce((s, m) => s + m.roundsPlayed, 0);
      if (totalGames === 0) {
        return NextResponse.json({ error: "해당 시즌에 플레이 기록이 없습니다." }, { status: 404 });
      }

      seasonId = seasonParam;
      seasonLabel = parseSeasonLabel(seasonParam);
    } else {
      // Default: lifetime (always has data, only 1 extra API call)
      const data = await getLifetimeStats(player.id, shard);
      gameModeStats = data.data.attributes.gameModeStats;
      seasonId = "lifetime";
      seasonLabel = "전체 (라이프타임)";
    }

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
      seasonId,
      seasonLabel,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "분석 중 오류가 발생했습니다.";
    const status = message.includes("찾을 수 없") || message.includes("없습니다") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
