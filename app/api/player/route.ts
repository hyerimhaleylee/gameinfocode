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
  getAvailableNormalTeams,
  extractTeamStats,
  adaptRankedToNormal,
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
  const num = seasonId.match(/pc-\d{4}-(\d+)/)?.[1];
  return num ? `시즌 ${parseInt(num)}` : seasonId;
}

async function fetchAndStoreRanked(
  accountId: string,
  seasonId: string,
  shard: string
): Promise<Record<string, unknown> | null> {
  try {
    return await getRankedSeasonStats(accountId, seasonId, shard) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name");
  const seasonParam = req.nextUrl.searchParams.get("season");
  const cachedAccountId = req.nextUrl.searchParams.get("accountId");
  const cachedShard = req.nextUrl.searchParams.get("shard");
  const teamParam = (req.nextUrl.searchParams.get("team") ?? "squad") as "squad" | "duo" | "solo";
  const gameTypeParam = req.nextUrl.searchParams.get("gameType") ?? ""; // "normal" | "ranked" | ""

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

    const weaponStatsPromise = Promise.race([
      getWeaponStats(accountId, shard).catch(() => null),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
    ]);

    let gameModeStats: Record<string, RawModeStats>;
    let seasonId: string;
    let seasonLabel: string;
    let rankedModes: RankedModeRow[] | undefined;
    let rankedTier: RankedTier | null = null;
    // Keep raw ranked data so we can adapt it for processStats
    let rawRankedData: Record<string, unknown> | null = null;

    if (seasonParam && seasonParam !== "lifetime") {
      const [data, rankedRaw] = await Promise.all([
        getSeasonStats(accountId, seasonParam, shard),
        fetchAndStoreRanked(accountId, seasonParam, shard),
      ]);
      gameModeStats = data.data.attributes.gameModeStats;

      if (totalGamesIn(gameModeStats) === 0) {
        return NextResponse.json({ error: "해당 시즌에 플레이 기록이 없습니다." }, { status: 404 });
      }
      rawRankedData = rankedRaw;
      rankedTier = extractRankedTier(rankedRaw);
      if (rankedRaw) {
        const rows = getAllRankedModeRows(rankedRaw);
        if (rows.length > 0) rankedModes = rows;
      }
      seasonId = seasonParam;
      seasonLabel = parseSeasonLabel(seasonParam);
    } else if (!seasonParam) {
      const seasonList = await getSeasonsList(shard);
      const ordered = [
        ...seasonList.filter(s => s.attributes.isCurrentSeason),
        ...seasonList.filter(s => !s.attributes.isCurrentSeason),
      ];

      let foundSeason: { id: string; stats: Record<string, RawModeStats> } | null = null;

      for (const s of ordered.slice(0, 15)) {
        let stats: Record<string, RawModeStats> | null = null;
        try {
          const data = await getSeasonStats(accountId, s.id, shard, { cache: "no-store" } as RequestInit);
          stats = data.data.attributes.gameModeStats as Record<string, RawModeStats>;
        } catch (e) {
          const msg = e instanceof Error ? e.message : "";
          if (msg.includes("(429)")) break; // rate limit — stop all attempts
          continue; // 404 (no data this season) — try next season
        }
        if (stats && totalGamesIn(stats) > 0) {
          foundSeason = { id: s.id, stats };
          break;
        }
      }

      if (foundSeason) {
        gameModeStats = foundSeason.stats;
        seasonId = foundSeason.id;
        seasonLabel = parseSeasonLabel(foundSeason.id);
        const rankedRaw = await fetchAndStoreRanked(accountId, foundSeason.id, shard);
        rawRankedData = rankedRaw;
        rankedTier = extractRankedTier(rankedRaw);
        if (rankedRaw) {
          const rows = getAllRankedModeRows(rankedRaw);
          if (rows.length > 0) rankedModes = rows;
        }
      } else {
        // foundSeason = null: no normal game data found in the last 15 seasons.
        // Check current season ranked first — if ranked exists, it's more recent
        // than any old lifetime normal data, so show ranked/current season.
        const currentSeason = await getCurrentSeason(shard).catch(() => null);
        if (currentSeason) {
          const rankedRaw = await fetchAndStoreRanked(accountId, currentSeason.id, shard);
          rawRankedData = rankedRaw;
          rankedTier = extractRankedTier(rankedRaw);
          if (rankedRaw) {
            const rows = getAllRankedModeRows(rankedRaw);
            if (rows.length > 0) rankedModes = rows;
          }
          const rankedPresent = rankedRaw ? adaptRankedToNormal(rankedRaw as Record<string, unknown>) !== null : false;
          if (rankedPresent) {
            // Has ranked data in current season — player plays ranked, not normal
            // Use current season context with empty normal stats so ranked is shown
            gameModeStats = {} as Record<string, RawModeStats>;
            seasonId = currentSeason.id;
            seasonLabel = parseSeasonLabel(currentSeason.id);
          } else {
            // No ranked either — true lifetime fallback
            const [primaryData] = await Promise.all([getLifetimeStats(accountId, shard)]);
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
            seasonId = "lifetime";
            seasonLabel = "전체 (라이프타임)";
          }
        } else {
          // Can't determine current season — true lifetime fallback
          const primaryData = await getLifetimeStats(accountId, shard);
          gameModeStats = primaryData.data.attributes.gameModeStats;
          seasonId = "lifetime";
          seasonLabel = "전체 (라이프타임)";
        }
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
        const rankedRaw = await fetchAndStoreRanked(accountId, currentSeason.id, shard);
        rawRankedData = rankedRaw;
        rankedTier = extractRankedTier(rankedRaw);
        if (rankedRaw) {
          const rows = getAllRankedModeRows(rankedRaw);
          if (rows.length > 0) rankedModes = rows;
        }
      }

      seasonId = "lifetime";
      seasonLabel = "전체 (라이프타임)";
    }

    // ── Mode / team selection ──────────────────────────────────────────────
    const availableNormalTeams = getAvailableNormalTeams(gameModeStats);
    const rankedAdapted = rawRankedData ? adaptRankedToNormal(rawRankedData) : null;
    const hasRanked = rankedAdapted !== null;

    let activeGameType: "normal" | "ranked";
    let activeTeam: "squad" | "duo" | "solo";
    let finalRawStats: RawModeStats;
    let modeKey: string;

    if (gameTypeParam === "ranked") {
      if (!rankedAdapted) {
        return NextResponse.json({ error: "경쟁전 데이터가 없습니다." }, { status: 404 });
      }
      finalRawStats = rankedAdapted;
      modeKey = "squad-fpp";
      activeGameType = "ranked";
      activeTeam = "squad";
    } else if (gameTypeParam === "normal") {
      const extracted = extractTeamStats(gameModeStats, teamParam);
      if (!extracted) {
        const label = teamParam === "squad" ? "스쿼드" : teamParam === "duo" ? "듀오" : "솔로";
        return NextResponse.json({ error: `${label} 일반전 데이터가 없습니다.` }, { status: 404 });
      }
      finalRawStats = extracted.stats;
      modeKey = extracted.modeKey;
      activeGameType = "normal";
      activeTeam = teamParam;
    } else {
      // Auto-detect: normal squad → ranked → best other normal
      const squadExtracted = extractTeamStats(gameModeStats, "squad");
      if (squadExtracted) {
        finalRawStats = squadExtracted.stats;
        modeKey = squadExtracted.modeKey;
        activeGameType = "normal";
        activeTeam = "squad";
      } else if (rankedAdapted) {
        finalRawStats = rankedAdapted;
        modeKey = "squad-fpp";
        activeGameType = "ranked";
        activeTeam = "squad";
      } else {
        const { stats: bs, modeKey: mk } = extractBestModeStats(gameModeStats);
        finalRawStats = bs;
        modeKey = mk;
        activeGameType = "normal";
        activeTeam = mk.includes("squad") ? "squad" : mk.includes("duo") ? "duo" : "solo";
      }
    }

    const stats = processStats(playerName, finalRawStats);
    const modeName = activeGameType === "ranked" ? "스쿼드 랭크드" : getModeLabel(modeKey);
    const allModes = getAllModeRows(gameModeStats, playerName);

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
      activeGameType,
      activeTeam,
      availableNormalTeams,
      hasRanked,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "분석 중 오류가 발생했습니다.";
    const status = message.includes("찾을 수 없") || message.includes("없습니다") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
