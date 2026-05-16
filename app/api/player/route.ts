import { NextRequest, NextResponse } from "next/server";
import { findPlayer, getSeasonStats, getLifetimeStats, getTeammatesFromMatches } from "@/lib/pubg";
import {
  extractBestModeStats,
  getAllModeRows,
  getModeLabel,
  processStats,
  determinePersona,
  generateInsights,
  generateRecommendation,
  calculateRadarValues,
} from "@/lib/persona";
import type { RawModeStats } from "@/lib/persona";

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

function totalGamesIn(stats: Record<string, RawModeStats>) {
  return Object.values(stats).reduce((s, m) => s + m.roundsPlayed, 0);
}

function parseSeasonLabel(seasonId: string) {
  const num = seasonId.match(/pc-2018-(\d+)/)?.[1];
  return num ? `시즌 ${parseInt(num)}` : seasonId;
}

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name");
  const seasonParam = req.nextUrl.searchParams.get("season");
  const cachedAccountId = req.nextUrl.searchParams.get("accountId");
  const cachedShard = req.nextUrl.searchParams.get("shard");

  if (!name) {
    return NextResponse.json({ error: "닉네임을 입력해주세요." }, { status: 400 });
  }

  try {
    let accountId: string;
    let playerName: string;
    let shard: string;
    let recentMatchIds: string[] = [];

    if (cachedAccountId && cachedShard) {
      accountId = cachedAccountId;
      shard = cachedShard;
      playerName = name;
    } else {
      const { player, shard: foundShard } = await resolvePlayer(name);
      accountId = player.id;
      playerName = player.attributes.name;
      shard = foundShard;
      recentMatchIds = (player.relationships?.matches?.data ?? []).map((m: { id: string }) => m.id);
    }

    let gameModeStats: Record<string, RawModeStats>;
    let seasonId: string;
    let seasonLabel: string;

    if (seasonParam && seasonParam !== "lifetime") {
      const data = await getSeasonStats(accountId, seasonParam, shard);
      gameModeStats = data.data.attributes.gameModeStats;

      if (totalGamesIn(gameModeStats) === 0) {
        return NextResponse.json({ error: "해당 시즌에 플레이 기록이 없습니다." }, { status: 404 });
      }
      seasonId = seasonParam;
      seasonLabel = parseSeasonLabel(seasonParam);
    } else {
      // Default: lifetime. If primary shard has no data, try the other shard.
      const primaryData = await getLifetimeStats(accountId, shard);
      gameModeStats = primaryData.data.attributes.gameModeStats;

      if (totalGamesIn(gameModeStats) === 0) {
        const otherShard = shard === "steam" ? "kakao" : "steam";
        try {
          const otherData = await getLifetimeStats(accountId, otherShard);
          if (totalGamesIn(otherData.data.attributes.gameModeStats) > 0) {
            gameModeStats = otherData.data.attributes.gameModeStats;
            shard = otherShard;
            // Re-fetch player from the other shard to get match IDs if we don't have any
            if (recentMatchIds.length === 0) {
              try {
                const variants = [...new Set([name, name.toUpperCase(), name.toLowerCase()])];
                for (const variant of variants) {
                  try {
                    const otherPlayer = await findPlayer(variant, otherShard);
                    recentMatchIds = (otherPlayer.relationships?.matches?.data ?? []).map((m: { id: string }) => m.id);
                    if (recentMatchIds.length > 0) break;
                  } catch { /* continue */ }
                }
              } catch { /* non-critical */ }
            }
          }
        } catch { /* stay with primary */ }
      }
      seasonId = "lifetime";
      seasonLabel = "전체 (라이프타임)";
    }

    const { stats: rawStats, modeKey } = extractBestModeStats(gameModeStats);
    const stats = processStats(playerName, rawStats);
    const modeName = getModeLabel(modeKey);
    const allModes = getAllModeRows(gameModeStats, playerName);
    const persona = determinePersona(stats);
    const insights = generateInsights(stats);
    const recommendation = generateRecommendation(stats);
    const radarValues = calculateRadarValues(stats);

    // Fetch teammates from up to 20 recent matches (non-critical, best-effort)
    let teammates: { name: string; accountId: string; sharedMatches: number }[] = [];
    if (recentMatchIds.length > 0) {
      try {
        teammates = await getTeammatesFromMatches(recentMatchIds, accountId, shard, 20);
      } catch { /* non-critical */ }
    }

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
      accountId,
      shard,
      modeKey,
      modeName,
      allModes,
      teammates,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "분석 중 오류가 발생했습니다.";
    const status = message.includes("찾을 수 없") || message.includes("없습니다") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
