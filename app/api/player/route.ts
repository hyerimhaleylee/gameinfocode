import { NextRequest, NextResponse } from "next/server";
import {
  findPlayer,
  getSeasonsList,
  getCurrentSeason,
  getSeasonStats,
  getLifetimeStats,
} from "@/lib/pubg";
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

function parseSeasonLabel(seasonId: string) {
  const num = seasonId.match(/pc-2018-(\d+)/)?.[1];
  return num ? `시즌 ${parseInt(num)}` : seasonId;
}

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name");
  const seasonParam = req.nextUrl.searchParams.get("season"); // "lifetime" | season ID | null

  if (!name) {
    return NextResponse.json({ error: "닉네임을 입력해주세요." }, { status: 400 });
  }

  try {
    const { player, shard } = await resolvePlayer(name);

    let gameModeStats: Record<string, import("@/lib/persona").RawModeStats>;
    let seasonId: string;
    let seasonLabel: string;

    if (seasonParam === "lifetime") {
      const data = await getLifetimeStats(player.id, shard);
      gameModeStats = data.data.attributes.gameModeStats;
      seasonId = "lifetime";
      seasonLabel = "전체 (라이프타임)";
    } else if (seasonParam) {
      const data = await getSeasonStats(player.id, seasonParam, shard);
      gameModeStats = data.data.attributes.gameModeStats;
      seasonId = seasonParam;
      seasonLabel = parseSeasonLabel(seasonParam);
    } else {
      // Auto: try current season, fallback to lifetime
      const current = await getCurrentSeason(shard);
      const data = await getSeasonStats(player.id, current.id, shard);
      gameModeStats = data.data.attributes.gameModeStats;

      const totalGames = Object.values(gameModeStats as Record<string, { roundsPlayed: number }>).reduce((s, m) => s + m.roundsPlayed, 0);
      if (totalGames === 0) {
        const lifetime = await getLifetimeStats(player.id, shard);
        gameModeStats = lifetime.data.attributes.gameModeStats;
        seasonId = "lifetime";
        seasonLabel = "전체 (라이프타임)";
      } else {
        seasonId = current.id;
        seasonLabel = parseSeasonLabel(current.id);
      }
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
    const status = message.includes("찾을 수 없") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
