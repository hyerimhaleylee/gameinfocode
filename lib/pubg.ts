import { Redis } from "@upstash/redis";

// Upstash Redis client — auto-reads UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
// Gracefully undefined if env vars not set yet
const redis = (() => {
  try { return Redis.fromEnv(); } catch { return null; }
})();

// L1: in-memory cache — survives within a warm function instance
const _memCache = new Map<string, string[]>();

const BASE = "https://api.pubg.com/shards";

// Supports multiple comma-separated keys in PUBG_API_KEY for rate limit distribution
function getApiKeys(): string[] {
  const raw = (process.env.PUBG_API_KEY ?? "").replace(/^﻿/, "").trim();
  return raw.split(",").map((k) => k.trim()).filter(Boolean);
}

let _keyIndex = 0;
function pickKey(keys: string[]): string {
  if (keys.length === 0) return "";
  const key = keys[_keyIndex % keys.length];
  _keyIndex = (_keyIndex + 1) % keys.length;
  return key;
}

function makeHeaders(key: string): HeadersInit {
  return {
    Authorization: `Bearer ${key}`,
    Accept: "application/vnd.api+json",
  };
}

async function pubgFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const keys = getApiKeys();
  let lastRes: Response | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    const key = pickKey(keys);
    const res = await fetch(url, { ...init, headers: makeHeaders(key) });
    lastRes = res;

    if (res.status === 429) {
      // Try next key first, then sleep
      if (keys.length > 1) {
        const retry = await fetch(url, { ...init, headers: makeHeaders(pickKey(keys)) });
        if (retry.status !== 429) return retry;
      }
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      continue;
    }

    if (res.status >= 500 && attempt < 2) {
      await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
      continue;
    }

    return res;
  }
  return lastRes!;
}

export async function findPlayer(name: string, shard = "steam") {
  const res = await pubgFetch(
    `${BASE}/${shard}/players?filter[playerNames]=${encodeURIComponent(name)}`,
    { next: { revalidate: 60 } } as RequestInit
  );
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    if (res.status === 404 || json?.errors?.[0]?.title === "Not Found") throw new Error("NOT_FOUND");
    throw new Error(`PUBG API 오류 (${res.status})`);
  }
  const json = await res.json();
  if (!json.data?.length) throw new Error("NOT_FOUND");
  return json.data[0]; // includes relationships.matches.data
}

// Query multiple name variants in a single API call (PUBG supports comma-separated playerNames)
export async function findPlayerBulk(names: string[], shard = "steam") {
  const unique = [...new Set(names)];
  const res = await pubgFetch(
    `${BASE}/${shard}/players?filter[playerNames]=${encodeURIComponent(unique.join(","))}`,
    { next: { revalidate: 60 } } as RequestInit
  );
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    if (res.status === 404 || json?.errors?.[0]?.title === "Not Found") throw new Error("NOT_FOUND");
    throw new Error(`PUBG API 오류 (${res.status})`);
  }
  const json = await res.json();
  if (!json.data?.length) throw new Error("NOT_FOUND");
  return json.data[0];
}

export async function getSeasonsList(shard = "steam") {
  const res = await pubgFetch(`${BASE}/${shard}/seasons`, {
    next: { revalidate: 3600 },
  } as RequestInit);
  if (!res.ok) throw new Error(`시즌 조회 오류 (${res.status})`);
  const json = await res.json();
  return (json.data as Array<{ id: string; attributes: { isCurrentSeason: boolean; isOffseason: boolean } }>)
    .filter((s) => /pc-2018-\d+/.test(s.id))
    .sort((a, b) => {
      const na = parseInt(a.id.match(/pc-2018-(\d+)/)![1]);
      const nb = parseInt(b.id.match(/pc-2018-(\d+)/)![1]);
      return nb - na;
    });
}

export async function getCurrentSeason(shard = "steam") {
  const seasons = await getSeasonsList(shard);
  const current = seasons.find((s) => s.attributes.isCurrentSeason);
  if (!current) throw new Error("현재 시즌 정보를 찾을 수 없습니다.");
  return current;
}

export async function getSeasonStats(accountId: string, seasonId: string, shard = "steam") {
  const res = await pubgFetch(
    `${BASE}/${shard}/players/${accountId}/seasons/${seasonId}`,
    { next: { revalidate: 300 } } as RequestInit
  );
  if (!res.ok) throw new Error(`스탯 조회 오류 (${res.status})`);
  return await res.json();
}

export async function getLifetimeStats(accountId: string, shard = "steam") {
  const res = await pubgFetch(
    `${BASE}/${shard}/players/${accountId}/seasons/lifetime`,
    { next: { revalidate: 300 } } as RequestInit
  );
  if (!res.ok) throw new Error(`라이프타임 스탯 조회 오류 (${res.status})`);
  return await res.json();
}

const MAP_NAMES: Record<string, string> = {
  Baltic_Main: "에란겔",
  Erangel_Main: "에란겔",
  Desert_Main: "미라마",
  Savage_Main: "사녹",
  DihorOtok_Main: "비켄디",
  Summerland_Main: "카라킨",
  Tiger_Main: "태이고",
  Kiki_Main: "데스턴",
  Neon_Main: "론도",
  Range_Main: "연습장",
};

const MODE_LABELS: Record<string, string> = {
  squad: "스쿼드 3인칭",
  "squad-fpp": "스쿼드 1인칭",
  duo: "듀오 3인칭",
  "duo-fpp": "듀오 1인칭",
  solo: "솔로 3인칭",
  "solo-fpp": "솔로 1인칭",
};

export interface MatchTeammate {
  name: string;
  accountId: string;
  kills: number;
  damage: number;
}

export interface MatchEntry {
  matchId: string;
  date: string;
  map: string;
  gameMode: string;
  placement: number;
  totalParticipants: number;
  kills: number;
  assists: number;
  damage: number;
  headshots: number;
  survivalTime: number;
  teammates: MatchTeammate[];
}

async function fetchMatchDetail(
  matchId: string,
  accountId: string,
  shard: string
): Promise<MatchEntry | null> {
  const res = await pubgFetch(`${BASE}/${shard}/matches/${matchId}`);
  if (!res.ok) return null;

  const json = await res.json();
  const data = json.data;
  const included: unknown[] = json.included ?? [];

  type RawParticipant = {
    id: string;
    type: string;
    attributes: { stats: { playerId: string; name: string; kills: number; assists: number; damageDealt: number; headshotKills: number; timeSurvived: number; winPlace: number } };
  };
  type RawRoster = {
    type: string;
    attributes: { stats: { rank: number } };
    relationships: { participants: { data: { id: string }[] } };
  };

  const participants = included.filter((x) => (x as { type: string }).type === "participant") as RawParticipant[];
  const rosters = included.filter((x) => (x as { type: string }).type === "roster") as RawRoster[];

  const me = participants.find((p) => p.attributes?.stats?.playerId === accountId);
  if (!me) return null;

  const myRoster = rosters.find((r) =>
    r.relationships?.participants?.data?.some((p) => p.id === me.id)
  );

  const teammates: MatchTeammate[] = myRoster
    ? myRoster.relationships.participants.data
        .filter((p) => p.id !== me.id)
        .map((p) => participants.find((pt) => pt.id === p.id))
        .filter((p): p is RawParticipant => !!p)
        .map((p) => ({
          name: p.attributes.stats.name,
          accountId: p.attributes.stats.playerId,
          kills: p.attributes.stats.kills,
          damage: Math.round(p.attributes.stats.damageDealt),
        }))
    : [];

  const s = me.attributes.stats;
  const mapRaw = data?.attributes?.mapName ?? "";
  const modeRaw = data?.attributes?.gameMode ?? "";

  return {
    matchId,
    date: data?.attributes?.createdAt ?? "",
    map: MAP_NAMES[mapRaw] ?? mapRaw,
    gameMode: MODE_LABELS[modeRaw] ?? modeRaw,
    placement: s.winPlace,
    totalParticipants: participants.length,
    kills: s.kills,
    assists: s.assists,
    damage: Math.round(s.damageDealt),
    headshots: s.headshotKills,
    survivalTime: s.timeSurvived,
    teammates,
  };
}

export async function getMatchHistory(
  matchIds: string[],
  accountId: string,
  shard = "steam",
  maxMatches = 20
): Promise<MatchEntry[]> {
  const results: MatchEntry[] = [];
  const batchSize = 7;
  for (let i = 0; i < matchIds.length && results.length < maxMatches; i += batchSize) {
    const batch = matchIds.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((id) => fetchMatchDetail(id, accountId, shard).catch(() => null))
    );
    results.push(...batchResults.filter((r): r is MatchEntry => r !== null));
  }
  return results.slice(0, maxMatches);
}

export async function accumulateMatchIds(accountId: string, freshIds: string[], maxHistory = 200): Promise<string[]> {
  const HISTORY_KEY = `player:match-history:${accountId}`;
  if (!redis) return freshIds;
  try {
    const stored = await redis.get<string[]>(HISTORY_KEY);
    const merged = [...new Set([...freshIds, ...(stored ?? [])])].slice(0, maxHistory);
    await redis.set(HISTORY_KEY, merged);
    return merged;
  } catch {
    return freshIds;
  }
}

export async function getRankedSeasonStats(
  accountId: string,
  seasonId: string,
  shard = "steam"
): Promise<Record<string, unknown> | null> {
  try {
    const res = await pubgFetch(
      `${BASE}/${shard}/players/${accountId}/seasons/${seasonId}/ranked`,
      { next: { revalidate: 300 } } as RequestInit
    );
    if (!res.ok) return null;
    const json = await res.json();
    return (json.data?.attributes?.rankedGameModeStats ?? null) as Record<string, unknown> | null;
  } catch {
    return null;
  }
}

export interface LeaderboardEntry {
  rank: number;
  accountId: string;
  name: string;
  rankPoint: number;
  wins: number;
  games: number;
  winRatio: number;
  averageDamage: number;
  kills: number;
  killDeathRatio: number;
  kda: number;
  averageRank: number;
}

export async function getLeaderboard(
  seasonId: string,
  gameMode: string,
  shard = "steam"
): Promise<LeaderboardEntry[]> {
  const res = await pubgFetch(
    `${BASE}/${shard}/leaderboards/${seasonId}/${gameMode}?filter[playerCount]=100`,
    { next: { revalidate: 3600 } } as RequestInit
  );
  const resText = await res.text();
  if (!res.ok) throw new Error(`리더보드 조회 오류 (${res.status}): ${resText.slice(0, 200)}`);

  const json = JSON.parse(resText) as Record<string, unknown>;

  type RawPlayer = {
    type: string;
    id: string;
    attributes: {
      name: string;
      rank: number;
      stats: {
        rankPoint?: number;
        wins?: number;
        games?: number;
        winRatio?: number;
        averageDamage?: number;
        kills?: number;
        killDeathRatio?: number;
        kda?: number;
        averageRank?: number;
      };
    };
  };

  const mapPlayer = (p: RawPlayer): LeaderboardEntry => {
    const s = p.attributes.stats;
    return {
      rank: p.attributes.rank,
      accountId: p.id,
      name: p.attributes.name,
      rankPoint: s.rankPoint ?? 0,
      wins: s.wins ?? 0,
      games: s.games ?? 0,
      winRatio: s.winRatio ?? 0,
      averageDamage: s.averageDamage ?? 0,
      kills: s.kills ?? 0,
      killDeathRatio: s.killDeathRatio ?? 0,
      kda: s.kda ?? 0,
      averageRank: s.averageRank ?? 0,
    };
  };

  // JSONAPI format: players in included[]
  const included = (json.included ?? []) as RawPlayer[];
  const fromIncluded = included.filter((p) => p.type === "player");
  if (fromIncluded.length > 0) {
    return fromIncluded
      .sort((a, b) => a.attributes.rank - b.attributes.rank)
      .slice(0, 100)
      .map(mapPlayer);
  }

  // Alternative: players embedded in data.relationships.players.data[]
  const relPlayers = (
    (json.data as Record<string, unknown>)?.relationships as Record<string, unknown>
  )?.players as { data?: RawPlayer[] } | undefined;
  const fromRel = relPlayers?.data ?? [];
  if (fromRel.length > 0) {
    return fromRel
      .sort((a, b) => a.attributes.rank - b.attributes.rank)
      .slice(0, 100)
      .map(mapPlayer);
  }

  return [];
}

// Fetch a single player by account ID (used by teammates endpoint)
export async function getPlayerById(accountId: string, shard = "steam") {
  const res = await pubgFetch(`${BASE}/${shard}/players/${accountId}`);
  if (!res.ok) throw new Error(`플레이어 조회 오류 (${res.status})`);
  const json = await res.json();
  return json.data;
}

// ─── WEAPON STATS (telemetry-based) ────────────────────────────────────────

const WEAPON_CATEGORY_MAP: Record<string, string[]> = {
  AR:       ["HK416", "AK47", "BerylM762", "SCARL", "SCAR-L", "G36C", "Groza", "QBZ", "QBZ95", "ACE32", "K2", "Mk47Mutant", "M16A4", "AUG"],
  SMG:      ["UMP45", "UMP", "Vector", "MicroUZI", "Thompson", "PP19Bizon", "BizonPP19", "MP5K", "P90"],
  SG:       ["Saiga12", "S686", "S1897", "S12K", "DBS", "O12"],
  DMR:      ["FNFal", "SKS", "Mk12", "Mk14", "QBU88", "QBU", "Mini14", "VSS"],
  SR:       ["Kar98k", "AWM", "M24", "Mosin", "Win94", "LynxAMR"],
  Throwable:["FragGrenade", "Molotov", "MolotovCocktail", "C4Explosive"],
};

export const WEAPON_DISPLAY_MAP: Record<string, string> = {
  HK416: "M416", AK47: "AKM", BerylM762: "Beryl M762", SCARL: "SCAR-L", "SCAR-L": "SCAR-L",
  G36C: "G36C", Groza: "Groza", QBZ: "QBZ95", QBZ95: "QBZ95", ACE32: "ACE32",
  K2: "K2", Mk47Mutant: "Mk47 Mutant", M16A4: "M16A4", AUG: "AUG A3",
  UMP45: "UMP45", UMP: "UMP45", Vector: "Vector", MicroUZI: "Micro UZI",
  Thompson: "Tommy Gun", PP19Bizon: "PP-19 Bizon", BizonPP19: "PP-19 Bizon",
  MP5K: "MP5K", P90: "P90",
  FNFal: "SLR", SKS: "SKS", Mk12: "Mk12", Mk14: "Mk14 EBR",
  QBU88: "QBU", QBU: "QBU", Mini14: "Mini 14", VSS: "VSS",
  Kar98k: "Kar98k", AWM: "AWM", M24: "M24", Mosin: "Mosin-Nagant",
  Win94: "Win94", LynxAMR: "Lynx AMR",
  Saiga12: "Saiga-12", S686: "S686", S1897: "S1897", S12K: "S12K", DBS: "DBS", O12: "O12",
  FragGrenade: "수류탄", Molotov: "화염병", MolotovCocktail: "화염병",
  C4Explosive: "C4",
};

function extractInternalName(damageCauserName: string): string {
  return damageCauserName
    .replace(/^Weap/, "")
    .replace(/^Proj/, "")
    .replace(/_C$/, "")
    .split("_")[0];
}

function categorizeWeapon(internalName: string): string {
  const lower = internalName.toLowerCase();
  for (const [cat, names] of Object.entries(WEAPON_CATEGORY_MAP)) {
    if (names.some((n) => n.toLowerCase() === lower)) return cat;
  }
  return "기타";
}

export interface WeaponKillEntry {
  internalName: string;
  displayName: string;
  category: string;
  kills: number;
}

export interface WeaponStats {
  byCategory: Record<string, number>;
  topWeapons: WeaponKillEntry[];
  totalTracked: number;
  matchesAnalyzed: number;
  cachedMatchCount?: number;
  nearPct: number; // (AR + SMG + SG) / total
  farPct: number;  // (DMR + SR) / total
}

function calcRangePcts(by: Record<string, number>, total: number): { nearPct: number; farPct: number } {
  if (total === 0) return { nearPct: 0, farPct: 0 };
  const near = (by.AR ?? 0) + (by.SMG ?? 0) + (by.SG ?? 0);
  const far = (by.DMR ?? 0) + (by.SR ?? 0);
  return { nearPct: Math.round((near / total) * 100), farPct: Math.round((far / total) * 100) };
}

async function fetchTelemetryUrl(matchId: string, shard: string): Promise<string | null> {
  try {
    const res = await pubgFetch(`${BASE}/${shard}/matches/${matchId}`, {
      next: { revalidate: 86400 },
    } as RequestInit);
    if (!res.ok) return null;
    const json = await res.json();
    const asset = (json.included ?? []).find(
      (x: { type: string }) => x.type === "asset"
    ) as { attributes: { URL: string } } | undefined;
    return asset?.attributes?.URL ?? null;
  } catch {
    return null;
  }
}

async function parseTelemetryText(text: string, accountId: string): Promise<string[]> {
  const TARGET = '"_T":"LogPlayerKillV2"';
  const results: string[] = [];
  let pos = 0;

  while (pos < text.length) {
    const idx = text.indexOf(TARGET, pos);
    if (idx === -1) break;

    let start = idx - 1;
    while (start >= 0 && text[start] !== "{") start--;
    if (start < 0) { pos = idx + TARGET.length; continue; }

    let depth = 0, end = start;
    for (; end < text.length; end++) {
      if (text[end] === "{") depth++;
      else if (text[end] === "}" && --depth === 0) { end++; break; }
    }

    try {
      const obj = JSON.parse(text.slice(start, end)) as {
        killer?: { accountId: string };
        killerDamageInfo?: { damageCauserName: string };
      };
      if (obj.killer?.accountId === accountId && obj.killerDamageInfo?.damageCauserName) {
        results.push(obj.killerDamageInfo.damageCauserName);
      }
    } catch { /* malformed — skip */ }

    pos = end;
  }

  return results;
}

async function fetchKillWeapons(
  telemetryUrl: string,
  accountId: string,
  matchId: string
): Promise<string[]> {
  const cacheKey = `weapon:kills:${matchId}:${accountId}`;

  // L1: memory cache (instant, same function instance)
  if (_memCache.has(cacheKey)) return _memCache.get(cacheKey)!;

  // L2: Upstash Redis (persists across instances and deployments)
  if (redis) {
    try {
      const cached = await redis.get<string[]>(cacheKey);
      if (cached !== null) {
        _memCache.set(cacheKey, cached);
        return cached;
      }
    } catch { /* Redis error — fall through */ }
  }

  // L3: fetch + parse telemetry
  try {
    const res = await fetch(telemetryUrl, {
      next: { revalidate: 86400 },
    } as RequestInit);
    if (!res.ok) return [];

    const text = await res.text();
    const results = await parseTelemetryText(text, accountId);

    // Write to both caches
    _memCache.set(cacheKey, results);
    if (redis) { try { await redis.set(cacheKey, results); } catch { /* Redis error */ } }

    return results;
  } catch {
    return [];
  }
}

export async function getWeaponMastery(accountId: string, shard = "steam"): Promise<WeaponStats> {
  const res = await pubgFetch(
    `${BASE}/${shard}/players/${accountId}/weapon_mastery`,
    { next: { revalidate: 3600 } } as RequestInit
  );
  if (!res.ok) throw new Error(`Weapon Mastery 조회 오류 (${res.status})`);
  const json = await res.json();

  const weaponsInfo = (json.data?.attributes?.weaponsInfo ?? {}) as Record<
    string,
    { statsTotal?: { kills?: number } }
  >;

  const byCategory: Record<string, number> = { AR: 0, SMG: 0, SG: 0, DMR: 0, SR: 0, Throwable: 0, 기타: 0 };
  const weaponCounts = new Map<string, number>();

  for (const [weaponId, data] of Object.entries(weaponsInfo)) {
    const kills = data.statsTotal?.kills ?? 0;
    if (kills === 0) continue;
    const internal = extractInternalName(weaponId);
    const cat = categorizeWeapon(internal);
    byCategory[cat] = (byCategory[cat] ?? 0) + kills;
    weaponCounts.set(internal, (weaponCounts.get(internal) ?? 0) + kills);
  }

  const totalTracked = Object.values(byCategory).reduce((a, b) => a + b, 0);
  const topWeapons: WeaponKillEntry[] = Array.from(weaponCounts.entries())
    .map(([internal, kills]) => ({
      internalName: internal,
      displayName: WEAPON_DISPLAY_MAP[internal] ?? internal,
      category: categorizeWeapon(internal),
      kills,
    }))
    .sort((a, b) => b.kills - a.kills)
    .slice(0, 15);

  const { nearPct, farPct } = calcRangePcts(byCategory, totalTracked);
  return { byCategory, topWeapons, totalTracked, matchesAnalyzed: -1, nearPct, farPct };
}

export async function getWeaponStats(accountId: string, shard = "steam"): Promise<WeaponStats> {
  const MAX_MATCHES = 20;
  const MAX_HISTORY = 200;
  const HISTORY_KEY = `player:match-history:${accountId}`;

  const player = await getPlayerById(accountId, shard);
  const freshIds: string[] = (player.relationships?.matches?.data ?? [])
    .slice(0, MAX_MATCHES)
    .map((m: { id: string }) => m.id);

  // Merge fresh IDs with Redis-stored history, deduplicate, cap at MAX_HISTORY
  const allMatchIds = await accumulateMatchIds(accountId, freshIds, MAX_HISTORY);
  const cachedCount = allMatchIds.length - freshIds.length;
  const matchIds = allMatchIds;

  if (matchIds.length === 0) {
    return { byCategory: {}, topWeapons: [], totalTracked: 0, matchesAnalyzed: 0, nearPct: 0, farPct: 0 };
  }

  const urlResults = await Promise.allSettled(
    matchIds.map((id) => fetchTelemetryUrl(id, shard).then((url) => ({ id, url })))
  );
  const telemetryEntries = urlResults
    .map((r) => (r.status === "fulfilled" ? r.value : null))
    .filter((v): v is { id: string; url: string } => v !== null && v.url !== null);

  const killResults = await Promise.allSettled(
    telemetryEntries.map(({ url, id }) => fetchKillWeapons(url, accountId, id))
  );
  const allWeapons = killResults.flatMap((r) =>
    r.status === "fulfilled" ? r.value : []
  );

  const byCategory: Record<string, number> = { AR: 0, SMG: 0, SG: 0, DMR: 0, SR: 0, Throwable: 0, 기타: 0 };
  const weaponCounts = new Map<string, number>();

  for (const raw of allWeapons) {
    const internal = extractInternalName(raw);
    const cat = categorizeWeapon(internal);
    byCategory[cat] = (byCategory[cat] ?? 0) + 1;
    weaponCounts.set(internal, (weaponCounts.get(internal) ?? 0) + 1);
  }

  const topWeapons: WeaponKillEntry[] = Array.from(weaponCounts.entries())
    .map(([internal, kills]) => ({
      internalName: internal,
      displayName: WEAPON_DISPLAY_MAP[internal] ?? internal,
      category: categorizeWeapon(internal),
      kills,
    }))
    .sort((a, b) => b.kills - a.kills)
    .slice(0, 15);

  const { nearPct, farPct } = calcRangePcts(byCategory, allWeapons.length);
  return {
    byCategory,
    topWeapons,
    totalTracked: allWeapons.length,
    matchesAnalyzed: telemetryEntries.length,
    cachedMatchCount: cachedCount,
    nearPct,
    farPct,
  };
}
