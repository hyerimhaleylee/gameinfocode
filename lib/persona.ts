export interface RawModeStats {
  kills: number;
  assists: number;
  dBNOs: number;
  damageDealt: number;
  headshotKills: number;
  longestTimeSurvived: number;
  losses: number;
  roundsPlayed: number;
  timeSurvived: number;
  top10s: number;
  wins: number;
}

export interface ProcessedStats {
  name: string;
  kd: number;
  winRate: number;
  avgDamage: number;
  headshotRate: number;
  top10Rate: number;
  avgSurvivalMin: number;
  roundsPlayed: number;
  assists: number;
  // Formatted
  kdStr: string;
  winRateStr: string;
  avgDamageStr: string;
  headshotStr: string;
  gamesStr: string;
}

export interface Persona {
  id: string;
  title: string;
  titleEn: string;
  quote: string;
  type: string;
  tier: string;
}

export interface Insight {
  type: "positive" | "warning" | "neutral";
  text: string;
}

export interface PlayerApiResponse {
  name: string;
  kd: string;
  winRate: string;
  avgDamage: string;
  headshot: string;
  games: string;
  persona: Persona;
  radarValues: number[];
  insights: Insight[];
  recommendation: string;
  seasonId: string;
  seasonLabel: string;
}

// Pick the game mode with the most rounds played
export function extractBestModeStats(
  gameModeStats: Record<string, RawModeStats>
): RawModeStats {
  const MODES = ["squad-fpp", "squad", "solo-fpp", "solo", "duo-fpp", "duo"];
  let best: RawModeStats | null = null;
  let bestGames = 0;

  for (const mode of MODES) {
    const s = gameModeStats[mode];
    if (s && s.roundsPlayed > bestGames) {
      best = s;
      bestGames = s.roundsPlayed;
    }
  }

  if (!best) throw new Error("이번 시즌 플레이 기록이 없습니다.");
  return best;
}

export function processStats(name: string, raw: RawModeStats): ProcessedStats {
  const games = Math.max(raw.roundsPlayed, 1);
  const deaths = Math.max(raw.losses, 1);
  const kills = raw.kills ?? 0;

  const kd = kills / deaths;
  const winRate = (raw.wins / games) * 100;
  const avgDamage = raw.damageDealt / games;
  const headshotRate = kills > 0 ? (raw.headshotKills / kills) * 100 : 0;
  const top10Rate = (raw.top10s / games) * 100;
  const avgSurvivalMin = raw.timeSurvived / games / 60;

  return {
    name,
    kd,
    winRate,
    avgDamage,
    headshotRate,
    top10Rate,
    avgSurvivalMin,
    roundsPlayed: raw.roundsPlayed,
    assists: raw.assists,
    kdStr: kd.toFixed(2),
    winRateStr: winRate.toFixed(1) + "%",
    avgDamageStr: Math.round(avgDamage).toString(),
    headshotStr: Math.round(headshotRate) + "%",
    gamesStr: raw.roundsPlayed.toLocaleString(),
  };
}

const PERSONA_DEFS: Array<{
  id: string;
  title: string;
  titleEn: string;
  quote: string;
  type: string;
  tier: string;
  match: (s: ProcessedStats) => boolean;
}> = [
  {
    id: "sniper",
    title: "통곡의 포탑",
    titleEn: "TOWER OF DESPAIR",
    quote: "보이기만 하면 죽인다.",
    type: "PRECISION MARKSMAN",
    tier: "DIAMOND",
    match: (s) => s.headshotRate >= 38,
  },
  {
    id: "left_hand",
    title: "왼손 압수",
    titleEn: "LEFT HAND CONFISCATED",
    quote: "무빙은 희생했지만, 에임은 신이 주었다.",
    type: "AGGRESSIVE RIFLER",
    tier: "GOLD",
    match: (s) => s.kd >= 2.5 && s.headshotRate >= 22,
  },
  {
    id: "chicken_hunter",
    title: "치킨 사냥꾼",
    titleEn: "CHICKEN HUNTER",
    quote: "살아남는 것이 가장 강한 전략이다.",
    type: "SURVIVAL SPECIALIST",
    tier: "PLATINUM",
    match: (s) => s.winRate >= 10,
  },
  {
    id: "infighter",
    title: "인파이터",
    titleEn: "CLOSE QUARTERS SPECIALIST",
    quote: "방 하나면 충분하다.",
    type: "CQC SPECIALIST",
    tier: "GOLD",
    match: (s) => s.kd >= 1.5 && s.avgDamage >= 250,
  },
  {
    id: "supporter",
    title: "조수석 마스터",
    titleEn: "PASSENGER MASTER",
    quote: "팀이 살아야 내가 산다.",
    type: "TACTICAL SUPPORT",
    tier: "SILVER",
    match: (s) => s.assists / Math.max(s.roundsPlayed, 1) >= 1.8,
  },
  {
    id: "grinder",
    title: "각자도생의 달인",
    titleEn: "LONE WOLF",
    quote: "살아있으면 기회는 온다.",
    type: "INDEPENDENT OPERATOR",
    tier: "SILVER",
    match: (s) => s.kd >= 1 && s.roundsPlayed >= 50,
  },
  {
    id: "rookie",
    title: "4렙 가방",
    titleEn: "LVL4 BACKPACK",
    quote: "아직 가방만 레벨4다. 하지만 시작했다.",
    type: "DEVELOPING WARRIOR",
    tier: "BRONZE",
    match: () => true,
  },
];

export function determinePersona(s: ProcessedStats): Persona {
  const found = PERSONA_DEFS.find((p) => p.match(s))!;
  return {
    id: found.id,
    title: found.title,
    titleEn: found.titleEn,
    quote: found.quote,
    type: found.type,
    tier: found.tier,
  };
}

export function generateInsights(s: ProcessedStats): Insight[] {
  const insights: Insight[] = [];

  if (s.kd >= 3)
    insights.push({ type: "positive", text: `K/D ${s.kdStr} — 상위 1% 수준의 교전 능력입니다.` });
  else if (s.kd >= 2)
    insights.push({ type: "positive", text: `K/D ${s.kdStr} — 평균 이상의 안정적인 교전 능력입니다.` });
  else if (s.kd < 1)
    insights.push({ type: "warning", text: `K/D ${s.kdStr} — 교전 선택과 포지셔닝 개선이 필요합니다.` });

  if (s.headshotRate >= 35)
    insights.push({ type: "positive", text: `헤드샷 비율 ${s.headshotStr} — 에임 정확도가 탁월합니다.` });
  else if (s.headshotRate < 15 && s.roundsPlayed > 50)
    insights.push({ type: "warning", text: `헤드샷 비율 ${s.headshotStr} — 조준 훈련으로 딜 효율을 높일 수 있습니다.` });

  if (s.avgDamage >= 350)
    insights.push({ type: "positive", text: `평균 딜량 ${s.avgDamageStr} — 매 교전에서 안정적인 딜을 넣습니다.` });
  else if (s.avgDamage < 100)
    insights.push({ type: "warning", text: `평균 딜량 ${s.avgDamageStr} — 교전 참여를 늘려 딜 효율을 높여야 합니다.` });

  if (s.winRate >= 12)
    insights.push({ type: "positive", text: `승률 ${s.winRateStr} — 후반 생존 능력과 결정력이 매우 우수합니다.` });
  else if (s.winRate < 2)
    insights.push({ type: "warning", text: `승률 ${s.winRateStr} — 자기장 운영과 후반 판단력 향상이 필요합니다.` });

  const apg = s.assists / Math.max(s.roundsPlayed, 1);
  if (apg >= 2)
    insights.push({ type: "positive", text: `경기당 평균 ${apg.toFixed(1)}개 어시스트 — 팀 기여도가 높습니다.` });

  if (s.top10Rate >= 40)
    insights.push({ type: "positive", text: `TOP 10 진입률 ${Math.round(s.top10Rate)}% — 생존 안정성이 뛰어납니다.` });

  if (insights.length === 0)
    insights.push({ type: "neutral", text: `${s.gamesStr}게임 분석 완료. 더 많은 데이터가 쌓일수록 정밀도가 높아집니다.` });

  return insights.slice(0, 5);
}

export function generateRecommendation(s: ProcessedStats): string {
  if (s.kd < 0.8)
    return "교전 선택을 줄이고 생존 위주로 플레이해보세요. 상위권 플레이어 관전을 통해 포지셔닝을 학습하는 것을 권장합니다.";
  if (s.headshotRate >= 35)
    return "에임이 뛰어난 플레이어입니다. 무빙 안정성과 포지셔닝만 보완하면 최상위권 진입이 가능합니다.";
  if (s.winRate >= 10)
    return "뛰어난 생존 능력을 갖추고 있습니다. 더 공격적인 교전으로 딜량을 끌어올리면 완성형 플레이어가 됩니다.";
  if (s.avgDamage >= 300)
    return "교전 능력이 우수합니다. 자기장 후반 운영 판단력을 높이면 승률이 크게 올라갈 것입니다.";
  return "꾸준한 플레이가 실력 향상의 핵심입니다. 교전 후 복기를 통해 패턴을 파악하고 개선해나가세요.";
}

export function calculateRadarValues(s: ProcessedStats): number[] {
  const combat = Math.min(100, Math.round(
    Math.min(s.kd / 5, 1) * 55 + Math.min(s.avgDamage / 600, 1) * 45
  ));
  const survival = Math.min(100, Math.round(
    Math.min(s.winRate / 15, 1) * 55 + Math.min(s.top10Rate / 45, 1) * 45
  ));
  const mobility = Math.min(100, Math.round(
    Math.min(s.avgSurvivalMin / 20, 1) * 55 + 30
  ));
  const avgAssists = s.assists / Math.max(s.roundsPlayed, 1);
  const squadplay = Math.min(100, Math.round(
    Math.min(avgAssists / 4, 1) * 65 + 20
  ));
  const consistency = Math.min(100, Math.round(
    Math.min(s.roundsPlayed / 250, 1) * 35 + Math.min(s.kd / 4, 1) * 65
  ));
  const adaptability = Math.min(100, Math.round(
    Math.min(s.headshotRate / 45, 1) * 40 +
    Math.min(s.avgDamage / 400, 1) * 35 + 25
  ));

  return [combat, survival, mobility, squadplay, consistency, adaptability];
}
