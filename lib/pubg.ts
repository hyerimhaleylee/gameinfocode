const BASE = "https://api.pubg.com/shards";

function getHeaders(): HeadersInit {
  const key = (process.env.PUBG_API_KEY ?? "").replace(/^﻿/, "").trim();
  return {
    Authorization: `Bearer ${key}`,
    Accept: "application/vnd.api+json",
  };
}

// Fetch wrapper that retries once on 429
async function pubgFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(url, { ...init, headers: getHeaders() });
  if (res.status === 429) {
    await new Promise((r) => setTimeout(r, 2500));
    const retry = await fetch(url, { ...init, headers: getHeaders() });
    return retry;
  }
  return res;
}

export async function findPlayer(name: string, shard = "steam") {
  const res = await pubgFetch(
    `${BASE}/${shard}/players?filter[playerNames]=${encodeURIComponent(name)}`,
    { next: { revalidate: 60 } } as RequestInit
  );
  if (res.status === 404 || !res.ok) {
    const json = await res.json().catch(() => ({}));
    if (res.status === 404 || json?.errors?.[0]?.title === "Not Found") {
      throw new Error("NOT_FOUND");
    }
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
