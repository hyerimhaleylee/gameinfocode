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
  const key = pickKey(keys);
  const res = await fetch(url, { ...init, headers: makeHeaders(key) });
  if (res.status === 429) {
    // Immediately try next key before falling back to sleep
    if (keys.length > 1) {
      const nextKey = pickKey(keys);
      const retry = await fetch(url, { ...init, headers: makeHeaders(nextKey) });
      if (retry.status !== 429) return retry;
    }
    await new Promise((r) => setTimeout(r, 2500));
    return fetch(url, { ...init, headers: makeHeaders(pickKey(keys)) });
  }
  return res;
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
  const ids = matchIds.slice(0, maxMatches);
  const results: MatchEntry[] = [];
  const batchSize = 5;
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((id) => fetchMatchDetail(id, accountId, shard).catch(() => null))
    );
    results.push(...batchResults.filter((r): r is MatchEntry => r !== null));
  }
  return results;
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

// Fetch a single player by account ID (used by teammates endpoint)
export async function getPlayerById(accountId: string, shard = "steam") {
  const res = await pubgFetch(`${BASE}/${shard}/players/${accountId}`);
  if (!res.ok) throw new Error(`플레이어 조회 오류 (${res.status})`);
  const json = await res.json();
  return json.data;
}
