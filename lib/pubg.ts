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

async function fetchMatchTeammates(
  matchId: string,
  accountId: string,
  shard: string
): Promise<{ name: string; accountId: string }[]> {
  const res = await pubgFetch(`${BASE}/${shard}/matches/${matchId}`);
  if (!res.ok) return [];

  const json = await res.json();
  const included: unknown[] = json.included ?? [];

  const participants = included.filter((x: unknown) => (x as { type: string }).type === "participant") as Array<{
    id: string;
    attributes: { stats: { playerId: string; name: string } };
  }>;

  const rosters = included.filter((x: unknown) => (x as { type: string }).type === "roster") as Array<{
    relationships: { participants: { data: { id: string }[] } };
  }>;

  const ourParticipant = participants.find((p) => p.attributes?.stats?.playerId === accountId);
  if (!ourParticipant) return [];

  const ourRoster = rosters.find((r) =>
    r.relationships?.participants?.data?.some((p) => p.id === ourParticipant.id)
  );
  if (!ourRoster) return [];

  return ourRoster.relationships.participants.data
    .filter((p) => p.id !== ourParticipant.id)
    .map((p) => participants.find((pt) => pt.id === p.id))
    .filter((p): p is NonNullable<typeof p> => !!p)
    .map((p) => ({ name: p.attributes.stats.name, accountId: p.attributes.stats.playerId }));
}

// Aggregates squadmates from up to maxMatches recent matches sequentially to avoid rate limits.
export async function getTeammatesFromMatches(
  matchIds: string[],
  accountId: string,
  shard = "steam",
  maxMatches = 5
): Promise<{ name: string; accountId: string; sharedMatches: number }[]> {
  const ids = matchIds.slice(0, maxMatches);
  const counts = new Map<string, { name: string; accountId: string; count: number }>();

  for (const id of ids) {
    try {
      const teammates = await fetchMatchTeammates(id, accountId, shard);
      for (const t of teammates) {
        const existing = counts.get(t.accountId);
        if (existing) existing.count++;
        else counts.set(t.accountId, { name: t.name, accountId: t.accountId, count: 1 });
      }
    } catch { /* skip failed match */ }
  }

  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map((t) => ({ name: t.name, accountId: t.accountId, sharedMatches: t.count }));
}

// Fetch a single player by account ID (used by teammates endpoint)
export async function getPlayerById(accountId: string, shard = "steam") {
  const res = await pubgFetch(`${BASE}/${shard}/players/${accountId}`);
  if (!res.ok) throw new Error(`플레이어 조회 오류 (${res.status})`);
  const json = await res.json();
  return json.data;
}
