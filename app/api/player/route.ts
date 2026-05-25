import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;
import { supabase } from "@/lib/supabase";
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

const PLAYER_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const SEASON_CACHE_TTL_MS = 60 * 60 * 1000;
const CURRENT_SEASON_TTL_MS = 7 * 24 * 60 * 60 * 1000;

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

async function resolvePlayer(name: string) {
  const t = name.trim();
  const lower = t.toLowerCase();
  const title = lower.charAt(0).toUpperCase() + lower.slice(1);
  const variants = [...new Set([t, lower, title, t.toUpperCase()])];

  for (const shard of ["steam", "kakao"] as const) {
    for (const variant of variants) {
      try {
        const player = await findPlayerBulk([variant], shard);
        return { player, shard };
      } catch (e) {
        if (e instanceof Error && e.message === "NOT_FOUND") continue;
        throw e;
      }
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

async function resolvePlayerCached(name: string) {
  const key = name.trim().toLowerCase();
  const since = new Date(Date.now() - PLAYER_CACHE_TTL_MS).toISOString();

  const { data: cached } = await supabase
    .from("player_cache")
    .select("account_id, player_name, shard")
    .eq("name_lower", key)
    .gte("cached_at", since)
    .maybeSingle();

  if (cached) {
    return { accountId: cached.account_id as string, playerName: cached.player_name as string, shard: cached.shard as string };
  }

  const { player, shard } = await resolvePlayer(name);
  supabase.from("player_cache").upsert(
    { name_lower: key, account_id: player.id, player_name: player.attributes.name, shard, cached_at: new Date().toISOString() },
    { onConflict: "name_lower" }
  ).catch(() => {});
  return { accountId: player.id, playerName: player.attributes.name, shard };
}

async function getCurrentSeasonCached(shard: string) {
  const since = new Date(Date.now() - CURRENT_SEASON_TTL_MS).toISOString();
  const { data: cached } = await supabase
    .from("current_season_cache")
    .select("season_id")
    .eq("shard", shard)
    .gte("cached_at", since)
    .maybeSingle();

  if (cached) return { id: cached.season_id as string };

  const season = await getCurrentSeason(shard);
  if (season) {
    supabase.from("current_season_cache").upsert(
      { shard, season_id: season.id, cached_at: new Date().toISOString() },
      { onConflict: "shard" }
    ).catch(() => {});
  }
  return season;
}

async function getSeasonCached(accountId: string, seasonId: string, shard: string) {
  const since = new Date(Date.now() - SEASON_CACHE_TTL_MS).toISOString();
  const { data } = await supabase
    .from("season_cache")
    .select("game_mode_stats, ranked_data, weapon_ratio")
    .eq("account_id", accountId)
    .eq("season_id", seasonId)
    .eq("shard", shard)
    .gte("cached_at", since)
    .maybeSingle();
  return data ?? null;
}

async function storeSeasonCache(
  accountId: string, seasonId: string, shard: string,
  gameModeStats: Record<string, RawModeStats>,
  rankedData: Record<string, unknown> | null,
  weaponRatio: WeaponRatio | null
) {
  await supabase.from("season_cache").upsert(
    {
      account_id: accountId, season_id: seasonId, shard,
      game_mode_stats: gameModeStats,
      ranked_data: rankedData,
      weapon_ratio: weaponRatio,
      cached_at: new Date().toISOString(),
    },
    { onConflict: "account_id,season_id,shard" }
  );
}

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name");
  const seasonParam = req.nextUrl.searchParams.get("season");
  const cachedAccountId = req.nextUrl.searchParams.get("accountId");
  const cachedShard = req.nextUrl.searchParams.get("shard");
  const teamParam = (req.nextUrl.searchParams.get("team") ?? "squad") as "squad" | "duo" | "solo";
  const gameTypeParam = req.nextUrl.searchParams.get("gameType") ?? "";

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
      const resolved = await resolvePlayerCached(name);
      accountId = resolved.accountId;
      playerName = resolved.playerName;
      shard = resolved.shard;
    }

    supabase.from("searches").insert({ query: playerName }).then(() => {});

    const weaponStatsPromise = !seasonParam
      ? Promise.race([
          getWeaponStats(accountId, shard).catch(() => null),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
        ])
      : Promise.resolve(null);

    let gameModeStats: Record<string, RawModeStats>;
    let seasonId: string;
    let seasonLabel: string;
    let rankedModes: RankedModeRow[] | undefined;
    let rankedTier: RankedTier | null = null;
    let rawRankedData: Record<string, unknown> | null = null;
    let weaponRatioFromCache: WeaponRatio | null = null;
    let seasonDataFromCache = false;

    if (seasonParam && seasonParam !== "lifetime") {
      const cached = await getSeasonCached(accountId, seasonParam, shard);
      if (cached) {
        gameModeStats = cached.game_mode_stats as Record<string, RawModeStats>;
        rawRankedData = cached.ranked_data as Record<string, unknown> | null;
        const cachedWeapon = cached.weapon_ratio as WeaponRatio | null;
        if (cachedWeapon) weaponRatioFromCache = cachedWeapon;
      } else {
        const [data, rankedRaw] = await Promise.all([
          getSeasonStats(accountId, seasonParam, shard),
          fetchAndStoreRanked(accountId, seasonParam, shard),
        ]);
        gameModeStats = data.data.attributes.gameModeStats;
        if (totalGamesIn(gameModeStats) === 0) {
          return NextResponse.json({ error: "해당 시즌에 플레이 기록이 없습니다." }, { status: 404 });
        }
        rawRankedData = rankedRaw;
        await storeSeasonCache(accountId, seasonParam, shard, gameModeStats, rankedRaw, null);
      }
      rankedTier = extractRankedTier(rawRankedData);
      if (rawRankedData) {
        const rows = getAllRankedModeRows(rawRankedData);
        if (rows.length > 0) rankedModes = rows;
      }
      seasonId = seasonParam;
      seasonLabel = parseSeasonLabel(seasonParam);
    } else if (!seasonParam) {
      let foundSeason: { id: string; stats: Record<string, RawModeStats> } | null = null;
      // undefined = not yet checked from cache; null/value = retrieved from cache
      let foundSeasonRanked: Record<string, unknown> | null | undefined = undefined;

      const currentSeason = await getCurrentSeasonCached(shard).catch(() => null);
      const skipId = currentSeason?.id;

      if (currentSeason) {
        let seasonCached = null;
        try { seasonCached = await getSeasonCached(accountId, currentSeason.id, shard); } catch { /* fall through to API */ }

        if (seasonCached && totalGamesIn(seasonCached.game_mode_stats as Record<string, RawModeStats>) > 0) {
          foundSeason = { id: currentSeason.id, stats: seasonCached.game_mode_stats as Record<string, RawModeStats> };
          foundSeasonRanked = seasonCached.ranked_data as Record<string, unknown> | null;
          const cachedWeapon = seasonCached.weapon_ratio as WeaponRatio | null;
          if (cachedWeapon) weaponRatioFromCache = cachedWeapon;
          seasonDataFromCache = true;
        } else {
          try {
            const data = await getSeasonStats(accountId, currentSeason.id, shard, { cache: "no-store" } as RequestInit);
            const stats = data.data.attributes.gameModeStats as Record<string, RawModeStats>;
            if (totalGamesIn(stats) > 0) {
              foundSeason = { id: currentSeason.id, stats };
            }
          } catch (e) {
            const msg = e instanceof Error ? e.message : "";
            if (msg.includes("(429)")) { /* rate limited — skip to fallback loop */ }
          }
        }
      }

      if (!foundSeason) {
        const seasonList = await getSeasonsList(shard);
        const ordered = [
          ...seasonList.filter(s => s.attributes.isCurrentSeason),
          ...seasonList.filter(s => !s.attributes.isCurrentSeason),
        ].filter(s => s.id !== skipId);

        for (const s of ordered.slice(0, 14)) {
          try {
            const data = await getSeasonStats(accountId, s.id, shard, { cache: "no-store" } as RequestInit);
            const stats = data.data.attributes.gameModeStats as Record<string, RawModeStats>;
            if (totalGamesIn(stats) > 0) {
              foundSeason = { id: s.id, stats };
              break;
            }
          } catch (e) {
            const msg = e instanceof Error ? e.message : "";
            if (msg.includes("(429)")) break;
            continue;
          }
        }
      }

      if (!foundSeason) {
        const altShard = shard === "steam" ? "kakao" : "steam";
        const altCurrentSeason = await getCurrentSeason(altShard).catch(() => null);
        const altSkipId = altCurrentSeason?.id;

        if (altCurrentSeason) {
          try {
            const data = await getSeasonStats(accountId, altCurrentSeason.id, altShard, { cache: "no-store" } as RequestInit);
            const stats = data.data.attributes.gameModeStats as Record<string, RawModeStats>;
            if (totalGamesIn(stats) > 0) {
              foundSeason = { id: altCurrentSeason.id, stats };
              shard = altShard;
            }
          } catch { /* continue to alt loop */ }
        }

        if (!foundSeason) {
          const altSeasonList = await getSeasonsList(altShard).catch(() => [] as Awaited<ReturnType<typeof getSeasonsList>>);
          const altOrdered = [
            ...altSeasonList.filter(s => s.attributes.isCurrentSeason),
            ...altSeasonList.filter(s => !s.attributes.isCurrentSeason),
          ].filter(s => s.id !== altSkipId);
          for (const s of altOrdered.slice(0, 9)) {
            try {
              const data = await getSeasonStats(accountId, s.id, altShard, { cache: "no-store" } as RequestInit);
              const stats = data.data.attributes.gameModeStats as Record<string, RawModeStats>;
              if (totalGamesIn(stats) > 0) {
                foundSeason = { id: s.id, stats };
                shard = altShard;
                break;
              }
            } catch (e) {
              const msg = e instanceof Error ? e.message : "";
              if (msg.includes("(429)")) break;
              continue;
            }
          }
        }
      }

      if (foundSeason) {
        gameModeStats = foundSeason.stats;
        seasonId = foundSeason.id;
        seasonLabel = parseSeasonLabel(foundSeason.id);

        if (foundSeasonRanked !== undefined) {
          rawRankedData = foundSeasonRanked;
        } else {
          const rankedRaw = await fetchAndStoreRanked(accountId, foundSeason.id, shard);
          rawRankedData = rankedRaw;
        }
        rankedTier = extractRankedTier(rawRankedData);
        if (rawRankedData) {
          const rows = getAllRankedModeRows(rawRankedData);
          if (rows.length > 0) rankedModes = rows;
        }
      } else {
        const noDataCurrentSeason = currentSeason ?? await getCurrentSeason(shard).catch(() => null);
        if (noDataCurrentSeason) {
          const rankedRaw = await fetchAndStoreRanked(accountId, noDataCurrentSeason.id, shard);
          rawRankedData = rankedRaw;
          rankedTier = extractRankedTier(rankedRaw);
          if (rankedRaw) {
            const rows = getAllRankedModeRows(rankedRaw);
            if (rows.length > 0) rankedModes = rows;
          }
          const rankedPresent = rankedRaw ? adaptRankedToNormal(rankedRaw as Record<string, unknown>) !== null : false;
          if (rankedPresent) {
            gameModeStats = {} as Record<string, RawModeStats>;
            seasonId = noDataCurrentSeason.id;
            seasonLabel = parseSeasonLabel(noDataCurrentSeason.id);
          } else {
            const primaryData = await getLifetimeStats(accountId, shard);
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
    let weaponRatio: WeaponRatio | null = weaponRatioFromCache;
    if (weaponStats && weaponStats.totalTracked >= 10) {
      weaponRatio = { nearPct: weaponStats.nearPct, farPct: weaponStats.farPct, totalTracked: weaponStats.totalTracked };
    }

    // Store season cache on fresh API fetch (fire-and-forget)
    if (!seasonParam && !seasonDataFromCache && seasonId !== "lifetime") {
      storeSeasonCache(accountId, seasonId, shard, gameModeStats, rawRankedData, weaponRatio).catch(() => {});
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
