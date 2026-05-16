const BASE = "https://api.pubg.com/shards";

function getHeaders(): HeadersInit {
  const key = (process.env.PUBG_API_KEY ?? "").replace(/^﻿/, "").trim();
  return {
    Authorization: `Bearer ${key}`,
    Accept: "application/vnd.api+json",
  };
}

export async function findPlayer(name: string, shard = "steam") {
  const res = await fetch(
    `${BASE}/${shard}/players?filter[playerNames]=${encodeURIComponent(name)}`,
    { headers: getHeaders(), next: { revalidate: 60 } }
  );
  if (res.status === 404) throw new Error("플레이어를 찾을 수 없습니다.");
  if (!res.ok) throw new Error(`PUBG API 오류 (${res.status})`);
  const json = await res.json();
  if (!json.data?.length) throw new Error("플레이어를 찾을 수 없습니다.");
  return json.data[0];
}

export async function getCurrentSeason(shard = "steam") {
  const res = await fetch(`${BASE}/${shard}/seasons`, {
    headers: getHeaders(),
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`시즌 조회 오류 (${res.status})`);
  const json = await res.json();
  const current = json.data.find(
    (s: { attributes: { isCurrentSeason: boolean } }) =>
      s.attributes.isCurrentSeason
  );
  if (!current) throw new Error("현재 시즌 정보를 찾을 수 없습니다.");
  return current;
}

export async function getSeasonStats(
  accountId: string,
  seasonId: string,
  shard = "steam"
) {
  const res = await fetch(
    `${BASE}/${shard}/players/${accountId}/seasons/${seasonId}`,
    { headers: getHeaders(), next: { revalidate: 300 } }
  );
  if (!res.ok) throw new Error(`스탯 조회 오류 (${res.status})`);
  return await res.json();
}
