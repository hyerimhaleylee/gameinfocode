import { NextRequest, NextResponse } from "next/server";
import { findPlayerBulk, getSeasonsList, getSeasonStats, getWeaponStats } from "@/lib/pubg";
import type { RawModeStats } from "@/lib/persona";

function totalGamesIn(stats: Record<string, RawModeStats>) {
  return Object.values(stats).reduce((s, m) => s + m.roundsPlayed, 0);
}

function caseVariants(name: string): string[] {
  const title = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  return [...new Set([name, name.toUpperCase(), name.toLowerCase(), title])];
}

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name") ?? "ottank0510";
  const log: string[] = [];

  try {
    // Step 1: resolvePlayer — same as player route
    let accountId = "";
    let shard = "";
    const variants = caseVariants(name);
    for (const sh of ["steam", "kakao"] as const) {
      try {
        const player = await findPlayerBulk(variants, sh);
        accountId = player.id;
        shard = sh;
        log.push(`resolvePlayer: found on ${sh}, accountId=${accountId}`);
        break;
      } catch (e) {
        log.push(`resolvePlayer: ${sh} NOT_FOUND (${e instanceof Error ? e.message : e})`);
      }
    }
    if (!accountId) { return NextResponse.json({ log, error: "player not found" }); }

    // Step 2: season list
    const seasonList = await getSeasonsList(shard);
    log.push(`getSeasonsList: ${seasonList.length} seasons, first=${seasonList[0]?.id}`);

    const ordered = [
      ...seasonList.filter(s => s.attributes.isCurrentSeason),
      ...seasonList.filter(s => !s.attributes.isCurrentSeason),
    ];
    log.push(`ordered[0]=${ordered[0]?.id} (current=${ordered[0]?.attributes.isCurrentSeason})`);

    // Step 3: start weapon stats BEFORE loop (old behavior — to test if it causes 429)
    const weaponPromise = getWeaponStats(accountId, shard).catch((e) => {
      log.push(`weaponStats error: ${e instanceof Error ? e.message : e}`);
      return null;
    });

    // Step 4: season loop
    let foundId = "";
    for (const s of ordered.slice(0, 5)) {
      try {
        const data = await getSeasonStats(accountId, s.id, shard, { cache: "no-store" } as RequestInit);
        const stats = data.data.attributes.gameModeStats as Record<string, RawModeStats>;
        const t = totalGamesIn(stats);
        log.push(`${s.id} → games=${t}`);
        if (t > 0) { foundId = s.id; break; }
      } catch (e) {
        log.push(`${s.id} → ERROR: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    log.push(`foundSeason=${foundId || "null (lifetime fallback)"}`);

    await weaponPromise;
    log.push("weaponStats done");

  } catch (e) {
    log.push(`FATAL: ${e instanceof Error ? e.message : String(e)}`);
  }

  return NextResponse.json({ log });
}
