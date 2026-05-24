import { NextRequest, NextResponse } from "next/server";
import { getSeasonsList, getSeasonStats } from "@/lib/pubg";
import type { RawModeStats } from "@/lib/persona";

function totalGamesIn(stats: Record<string, RawModeStats>) {
  return Object.values(stats).reduce((s, m) => s + m.roundsPlayed, 0);
}

export async function GET(req: NextRequest) {
  const accountId = req.nextUrl.searchParams.get("accountId") ?? "";
  const shard = req.nextUrl.searchParams.get("shard") ?? "steam";

  const log: string[] = [];

  try {
    const seasonList = await getSeasonsList(shard);
    log.push(`seasonList length: ${seasonList.length}`);
    log.push(`first 5: ${seasonList.slice(0, 5).map(s => `${s.id}(current=${s.attributes.isCurrentSeason})`).join(", ")}`);

    const ordered = [
      ...seasonList.filter(s => s.attributes.isCurrentSeason),
      ...seasonList.filter(s => !s.attributes.isCurrentSeason),
    ];
    log.push(`ordered[0]: ${ordered[0]?.id}`);

    for (const s of ordered.slice(0, 5)) {
      try {
        const data = await getSeasonStats(accountId, s.id, shard, { cache: "no-store" } as RequestInit);
        const stats = data.data.attributes.gameModeStats as Record<string, RawModeStats>;
        const total = totalGamesIn(stats);
        log.push(`${s.id} → totalGames=${total}`);
        if (total > 0) {
          log.push(`FOUND: ${s.id}`);
          break;
        }
      } catch (e) {
        log.push(`${s.id} → ERROR: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  } catch (e) {
    log.push(`FATAL: ${e instanceof Error ? e.message : String(e)}`);
  }

  return NextResponse.json({ log });
}
