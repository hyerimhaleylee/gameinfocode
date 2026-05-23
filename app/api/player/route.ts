import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;
import { findPlayerBulk, getSeasonStats, getSeasonsList, getLifetimeStats, getCurrentSeason, getRankedSeasonStats, getWeaponStats } from "@/lib/pubg";
import {
  extractBestModeStats,
  getAllModeRows,
  getAllRankedModeRows,
  getModeLabel,
  processStats,
  determinePersona,
  generateInsights,
  generateRecommendation,
  calculateRadarValues,
} from "@/lib/persona";
import type { RawModeStats, RankedModeRow, RankedTier, WeaponRatio } from "@/lib/persona";

function extractRankedTier(rankedStats: Record<string, unknown> | null): RankedTier | null {
  if (!rankedStats) return null;
  for (const mode of ["squad-fpp", "squad", "duo-fpp", "duo"]) {
    const m = rankedStats[mode] as { currentTier?: { tier: string; subTier: string }; roundsPlayed?: number } | undefined;
    if (m?.currentTier?.tier && m.currentTier.tier !== "Unranked" && (m.roundsPlayed ?? 0) > 0) {
      return { tier: m.currentTier.tier, subTier: m.currentTier.subTier };
    }
  }
  return null;
}

// Build case variants and query all at once in a single API call per shard
function caseVariants(name: string): string[] {
  const title = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  return [...new Set([name, name.toUpperCase(), name.toLowerCase(), title])];
}

async function resolvePlayer(name: string) {
  const variants = caseVariants(name);

  for (const shard of ["steam", "kakao"] as const) {
    try {
      const player = await findPlayerBulk(variants, shard);
      return { player, shard };
    } catch (e) {
      if (e instanceof Error && e.message !== "NOT_FOUND") throw e;
    }
  }
  throw new Error("플레이어를 찾을 수 없습니다. 닉네임을 다시 확인해주세요.");
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

    if (cachedAccountId && cachedShard) {
      accountId = cachedAccountId;
      shard = cachedShard;
      playerName = name;
    } else {
      const { player, shard: foundShard } = await resolvePlayer(name);
      accountId = player.id;
      playerName = player.attributes.name;
      shard = foundShard;
    }

    // Start weapon stats in background — runs parallel to season logic, 8s timeout
    const weaponStatsPromise = Promise.race([
      getWeaponStats(accountId, shard).catch(() => null),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
    ]);

    let gameModeStats: Record<string, RawModeStats>;
    let seasonId: string;
    let seasonLabel: string;
    let rankedModes: RankedModeRow[] | undefined;
    let rankedTier: RankedTier | null = null;

    if (seasonParam && seasonParam !== "lifetime") {
      const [data, rankedRaw] = await Promise.all([
        getSeasonStats(accountId, seasonParam, shard),
        getRankedSeasonStats(accountId, seasonParam, shard),
      ]);
      gameModeStats = data.data.attributes.gameModeStats;

      if (totalGamesIn(gameModeStats) === 0) {
        return NextResponse.json({ error: "해당 시즌에 플레이 기록이 없습니다." }, { status: 404 });
      }
      rankedTier = extractRankedTier(rankedRaw);
      if (rankedRaw) {
        const rows = getAllRankedModeRows(rankedRaw);
        if (rows.length > 0) rankedModes = rows;
      }
      seasonId = seasonParam;
      seasonLabel = parseSeasonLabel(seasonParam);
    } else if (!seasonParam) {
      // Auto-detect: always start from the current season (isCurrentSeason flag),
      // then try previous seasons in order. Never skip due to API errors.
      const seasonList = await getSeasonsList(shard);

      // Put isCurrentSeason first, then the rest in descending order
      const ordered = [
        ...seasonList.filter(s => s.attributes.isCurrentSeason),
        ...seasonList.filter(s => !s.attributes.isCurrentSeason),
      ];

      let foundSeason: { id: string; stats: Record<string, RawModeStats> } | null = null;

      for (const s of ordered.slice(0, 8)) {
        let stats: Record<string, RawModeStats> | null = null;
        try {
          const data = await getSeasonStats(accountId, s.id, shard);
          stats = data.data.attributes.gameModeStats as Record<string, RawModeStats>;
        } catch {
          // API error (rate limit, network): stop here rather than silently skipping
          // — don't fall to lifetime just because of a transient error
          break;
        }
        if (stats && totalGamesIn(stats) > 0) {
          foundSeason = { id: s.id, stats };
          break;
        }
        // 0 games in this season — try the previous one
      }

      if (foundSeason) {
        gameModeStats = foundSeason.stats;
        seasonId = foundSeason.id;
        seasonLabel = parseSeasonLabel(foundSeason.id);
        const rankedRaw = await getRankedSeasonStats(accountId, foundSeason.id, shard);
        rankedTier = extractRankedTier(rankedRaw);
        if (rankedRaw) {
          const rows = getAllRankedModeRows(rankedRaw);
          if (rows.length > 0) rankedModes = rows;
        }
      } else {
        // Lifetime fallback — only reached when player has no data in any of the last 8 seasons
        const [primaryData, currentSeason] = await Promise.all([
          getLifetimeStats(accountId, shard),
          getCurrentSeason(shard).catch(() => null),
        ]);
        gameModeStats = primaryData.data.attributes.gameModeStats;
        if (totalGamesIn(gameModeStats) === 0) {
          const otherShard = shard === "steam" ? "kakao" : "steam";
          try {
            const otherData = await getLifetimeStats(accountId, otherShard);
            if (totalGamesIn(otherData.data.attributes.gameModeStats) > 0) {
              gameModeStats = otherData.data.attributes.gameModeStats;
              shard = otherShard;
            }
          } catch { /* stay with primary */ }
        }
        if (currentSeason) {
          const rankedRaw = await getRankedSeasonStats(accountId, currentSeason.id, shard);
          rankedTier = extractRankedTier(rankedRaw);
          if (rankedRaw) {
            const rows = getAllRankedModeRows(rankedRaw);
            if (rows.length > 0) rankedModes = rows;
          }
        }
        seasonId = "lifetime";
        seasonLabel = "전체 (라이프타임)";
      }
    } else {
      // Explicit lifetime
      const [primaryData, currentSeason] = await Promise.all([
        getLifetimeStats(accountId, shard),
        getCurrentSeason(shard).catch(() => null),
      ]);
      gameModeStats = primaryData.data.attributes.gameModeStats;

      if (totalGamesIn(gameModeStats) === 0) {
        const otherShard = shard === "steam" ? "kakao" : "steam";
        try {
          const otherData = await getLifetimeStats(accountId, otherShard);
          if (totalGamesIn(otherData.data.attributes.gameModeStats) > 0) {
            gameModeStats = otherData.data.attributes.gameModeStats;
            shard = otherShard;
          }
        } catch { /* stay with primary */ }
      }

      if (currentSeason) {
        const rankedRaw = await getRankedSeasonStats(accountId, currentSeason.id, shard);
        rankedTier = extractRankedTier(rankedRaw);
        if (rankedRaw) {
          const rows = getAllRankedModeRows(rankedRaw);
          if (rows.length > 0) rankedModes = rows;
        }
      }

      seasonId = "lifetime";
      seasonLabel = "전체 (라이프타임)";
    }

    const { stats: rawStats, modeKey } = extractBestModeStats(gameModeStats);
    const stats = processStats(playerName, rawStats);
    const modeName = getModeLabel(modeKey);
    const allModes = getAllModeRows(gameModeStats, playerName);

    // Await weapon stats (should be done or near-done since it ran in parallel)
    const weaponStats = await weaponStatsPromise;
    let weaponRatio: WeaponRatio | null = null;
    if (weaponStats && weaponStats.totalTracked >= 10) {
      weaponRatio = { nearPct: weaponStats.nearPct, farPct: weaponStats.farPct, totalTracked: weaponStats.totalTracked };
    }

    const persona = determinePersona(stats);
    const insights = generateInsights(stats);
    const recommendation = generateRecommendation(stats);
    const radarValues = calculateRadarValues(stats);

    return NextResponse.json({
      name: stats.name,
      kd: stats.kdStr,
      kda: stats.kda.toFixed(2),
      winRate: stats.winRateStr,
      avgDamage: stats.avgDamageStr,
      headshot: stats.headshotStr,
      assistsPerGame: stats.assistsPerGame.toFixed(1),
      revivesPerGame: stats.revivesPerGame.toFixed(2),
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
      rankedModes,
      rankedTier,
      weaponRatio,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "분석 중 오류가 발생했습니다.";
    const status = message.includes("찾을 수 없") || message.includes("없습니다") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
