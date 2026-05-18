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
  heals: number;
  boosts: number;
  revives: number;
  longestKill: number;
  rideDistance: number;
  walkDistance: number;
  roundMostKills: number;
  vehicleDestroys: number;
  teamKills: number;
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
  kda: number;
  assistsPerGame: number;
  revivesPerGame: number;
  rideDistPerGame: number;
  walkDistPerGame: number;
  // Formatted
  kdStr: string;
  winRateStr: string;
  avgDamageStr: string;
  headshotStr: string;
  gamesStr: string;
}

export interface ModeRow {
  key: string;
  label: string;
  team: string;        // 스쿼드 | 듀오 | 솔로
  perspective: string; // 1인칭(FPP) | 3인칭(TPP)
  gameType: string;    // 일반전 (ranked is separate endpoint)
  gamesStr: string;
  wins: number;
  kdStr: string;
  winRateStr: string;
  avgDamageStr: string;
  headshotStr: string;
  top10Str: string;
}

export interface Persona {
  id: string;
  title: string;
  titleEn: string;
  quote: string;
  type: string;
  tier: string;
}

export interface RankedTier {
  tier: string;
  subTier: string;
}

export interface Insight {
  type: "positive" | "warning" | "neutral";
  text: string;
}

export interface RankedModeRow {
  key: string;
  team: string;
  perspective: string;
  gamesStr: string;
  kdStr: string;
  winRateStr: string;
  avgDamageStr: string;
  currentTier: string;
  currentRP: number;
  bestTier: string;
  bestRP: number;
}

export interface PlayerApiResponse {
  name: string;
  kd: string;
  kda: string;
  winRate: string;
  avgDamage: string;
  headshot: string;
  assistsPerGame: string;
  games: string;
  persona: Persona;
  radarValues: number[];
  insights: Insight[];
  recommendation: string;
  seasonId: string;
  seasonLabel: string;
  accountId: string;
  shard: string;
  modeKey: string;
  modeName: string;
  allModes: ModeRow[];
  rankedModes?: RankedModeRow[];
  rankedTier?: RankedTier | null;
}

const MODE_META: Record<string, { label: string; team: string; perspective: string }> = {
  "squad-fpp": { label: "스쿼드 1인칭", team: "스쿼드", perspective: "1인칭 (FPP)" },
  "squad":     { label: "스쿼드 3인칭", team: "스쿼드", perspective: "3인칭 (TPP)" },
  "duo-fpp":   { label: "듀오 1인칭",   team: "듀오",   perspective: "1인칭 (FPP)" },
  "duo":       { label: "듀오 3인칭",   team: "듀오",   perspective: "3인칭 (TPP)" },
  "solo-fpp":  { label: "솔로 1인칭",   team: "솔로",   perspective: "1인칭 (FPP)" },
  "solo":      { label: "솔로 3인칭",   team: "솔로",   perspective: "3인칭 (TPP)" },
};

// Keep backward-compat accessor
const MODE_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(MODE_META).map(([k, v]) => [k, v.label])
);

const MODE_ORDER = ["squad-fpp", "squad", "duo-fpp", "duo", "solo-fpp", "solo"];

// Prefer squad → duo → solo, and within each group pick whichever has more games
export function extractBestModeStats(
  gameModeStats: Record<string, RawModeStats>
): { stats: RawModeStats; modeKey: string } {
  const groups = [
    ["squad-fpp", "squad"],
    ["duo-fpp", "duo"],
    ["solo-fpp", "solo"],
  ];

  for (const group of groups) {
    const candidates = group
      .map((key) => ({ key, stats: gameModeStats[key] }))
      .filter((x) => x.stats?.roundsPlayed > 0)
      .sort((a, b) => b.stats.roundsPlayed - a.stats.roundsPlayed);
    if (candidates[0]) return { stats: candidates[0].stats, modeKey: candidates[0].key };
  }

  throw new Error("플레이 기록이 없습니다.");
}

export function getModeLabel(modeKey: string) {
  return MODE_LABEL[modeKey] ?? modeKey;
}

export function getAllModeRows(
  gameModeStats: Record<string, RawModeStats>,
  playerName: string
): ModeRow[] {
  return MODE_ORDER
    .filter((key) => gameModeStats[key]?.roundsPlayed > 0)
    .map((key) => {
      const m = gameModeStats[key];
      const s = processStats(playerName, m);
      const meta = MODE_META[key] ?? { label: key, team: key, perspective: "-" };
      return {
        key,
        label: meta.label,
        team: meta.team,
        perspective: meta.perspective,
        gameType: "일반전",
        gamesStr: m.roundsPlayed.toLocaleString(),
        wins: m.wins,
        kdStr: s.kdStr,
        winRateStr: s.winRateStr,
        avgDamageStr: s.avgDamageStr,
        headshotStr: s.headshotStr,
        top10Str: s.top10Rate.toFixed(1) + "%",
      };
    });
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
  const kda = (kills + (raw.assists ?? 0)) / deaths;
  const assistsPerGame = (raw.assists ?? 0) / games;
  const revivesPerGame = (raw.revives ?? 0) / games;
  const rideDistPerGame = (raw.rideDistance ?? 0) / games;
  const walkDistPerGame = (raw.walkDistance ?? 0) / games;

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
    kda,
    assistsPerGame,
    revivesPerGame,
    rideDistPerGame,
    walkDistPerGame,
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
    id: "perfect",
    title: "완성형 인간",
    titleEn: "PERFECT HUMAN",
    quote: "이 사람 핵 아니에요?",
    type: "APEX PREDATOR",
    tier: "DIAMOND",
    match: (s) => s.kd >= 3.5 && s.winRate >= 10 && s.avgDamage >= 350,
  },
  {
    id: "aim_god",
    title: "에임만 신, 뇌는 장식",
    titleEn: "AIM GOD, BRAIN OPTIONAL",
    quote: "총은 신이 주셨는데 판단은 안 주셨다",
    type: "MECHANICAL GENIUS",
    tier: "GOLD",
    match: (s) => s.kd >= 2.0 && s.winRate < 5 && s.headshotRate >= 28,
  },
  {
    id: "sniper",
    title: "저격의 신",
    titleEn: "GOD OF SNIPING",
    quote: "보이면 죽는다",
    type: "PRECISION MARKSMAN",
    tier: "GOLD",
    match: (s) => s.headshotRate >= 32 && s.kd >= 1.8,
  },
  {
    id: "savior",
    title: "팀의 구원자",
    titleEn: "TEAM SAVIOR",
    quote: "팀원이 쓰러지면 내 심장도 쓰러진다",
    type: "TACTICAL SUPPORT",
    tier: "SILVER",
    match: (s) => s.revivesPerGame >= 0.8 && s.assistsPerGame >= 1.0,
  },
  {
    id: "zone_master",
    title: "자기장 마스터",
    titleEn: "ZONE MASTER",
    quote: "자기장이 나를 위해 움직인다",
    type: "SURVIVAL SPECIALIST",
    tier: "GOLD",
    match: (s) => s.winRate >= 8 && s.avgSurvivalMin >= 22 && s.kd >= 1.0,
  },
  {
    id: "assault",
    title: "돌격대장",
    titleEn: "ASSAULT COMMANDER",
    quote: "들어가서 죽는 게 전략이야",
    type: "AGGRESSIVE RIFLER",
    tier: "GOLD",
    match: (s) => s.kd >= 1.5 && s.avgSurvivalMin < 15 && s.avgDamage >= 220,
  },
  {
    id: "sense",
    title: "센스쟁이",
    titleEn: "SENSE MASTER",
    quote: "팀이 잘 되면 나도 잘 된다",
    type: "IQ PLAYER",
    tier: "GOLD",
    match: (s) => s.kda >= 3.0 && s.assistsPerGame >= 1.5 && s.kd >= 1.2,
  },
  {
    id: "camper",
    title: "존버황제",
    titleEn: "KING OF CAMPING",
    quote: "싸움? 그게 뭔데 먹는 건가",
    type: "PASSIVE SURVIVOR",
    tier: "BRONZE",
    match: (s) => s.top10Rate >= 38 && s.kd < 1.0 && s.avgDamage < 130,
  },
  {
    id: "vehicle",
    title: "탈것 장인",
    titleEn: "VEHICLE MASTER",
    quote: "차가 곧 나다",
    type: "MOBILITY SPECIALIST",
    tier: "SILVER",
    match: (s) => s.rideDistPerGame >= 2500 && s.kd >= 1.0,
  },
  {
    id: "lone",
    title: "나만 살면 돼",
    titleEn: "LONE SURVIVOR",
    quote: "팀원? 나도 죽게 생겼는데",
    type: "LONE WOLF",
    tier: "SILVER",
    match: (s) => s.revivesPerGame < 0.15 && s.kd >= 1.2 && s.winRate >= 3,
  },
  {
    id: "barefoot",
    title: "맨발의 사나이",
    titleEn: "BAREFOOT WARRIOR",
    quote: "차는 약자가 타는 것",
    type: "GROUND OPERATOR",
    tier: "SILVER",
    match: (s) => s.walkDistPerGame >= 3500 && s.rideDistPerGame < 800,
  },
  {
    id: "marathon",
    title: "마라톤선수",
    titleEn: "MARATHON RUNNER",
    quote: "뛰는 게 좋아서 배그 한다",
    type: "DISTANCE WALKER",
    tier: "BRONZE",
    match: (s) => s.walkDistPerGame >= 4500 && s.kd < 1.0,
  },
  {
    id: "grinder",
    title: "성실한 삽질러",
    titleEn: "DEDICATED GRINDER",
    quote: "못해도 안 그만두는 게 실력이다",
    type: "PERSISTENT PLAYER",
    tier: "BRONZE",
    match: (s) => s.roundsPlayed >= 100 && s.kd < 1.0,
  },
  {
    id: "rookie",
    title: "4렙 가방",
    titleEn: "LVL4 BACKPACK",
    quote: "아직 가방만 레벨4다",
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

  if (s.assistsPerGame >= 2)
    insights.push({ type: "positive", text: `경기당 평균 ${s.assistsPerGame.toFixed(1)}개 어시스트 — 팀 기여도가 높습니다.` });

  if (s.revivesPerGame >= 0.8)
    insights.push({ type: "positive", text: `경기당 부활 ${s.revivesPerGame.toFixed(1)}회 — 뛰어난 팀원 서포트 능력입니다.` });

  if (s.rideDistPerGame >= 2500)
    insights.push({ type: "neutral", text: `경기당 주행거리 ${Math.round(s.rideDistPerGame)}m — 기동전을 선호하는 플레이 스타일입니다.` });

  if (s.top10Rate >= 40)
    insights.push({ type: "positive", text: `TOP 10 진입률 ${Math.round(s.top10Rate)}% — 생존 안정성이 뛰어납니다.` });

  if (insights.length === 0)
    insights.push({ type: "neutral", text: `${s.gamesStr}게임 분석 완료. 더 많은 데이터가 쌓일수록 정밀도가 높아집니다.` });

  return insights.slice(0, 5);
}

export function generateRecommendation(s: ProcessedStats): string {
  if (s.kd >= 3.5 && s.winRate >= 10)
    return "최상위권 플레이어입니다. 팀원과의 호흡을 맞추면 더 높은 랭크에 도달할 수 있습니다.";
  if (s.kd < 0.8)
    return "교전 선택을 줄이고 생존 위주로 플레이해보세요. 상위권 플레이어 관전을 통해 포지셔닝을 학습하는 것을 권장합니다.";
  if (s.headshotRate >= 32)
    return "에임이 뛰어난 플레이어입니다. 무빙 안정성과 포지셔닝만 보완하면 최상위권 진입이 가능합니다.";
  if (s.winRate >= 8 && s.avgSurvivalMin >= 22)
    return "뛰어난 생존 능력을 갖추고 있습니다. 더 공격적인 교전으로 딜량을 끌어올리면 완성형 플레이어가 됩니다.";
  if (s.revivesPerGame >= 0.8)
    return "팀에 없어서는 안 될 서포터입니다. 개인 교전 능력도 키우면 팀의 핵심 에이스로 거듭날 수 있습니다.";
  if (s.avgDamage >= 300)
    return "교전 능력이 우수합니다. 자기장 후반 운영 판단력을 높이면 승률이 크게 올라갈 것입니다.";
  if (s.rideDistPerGame >= 2500)
    return "기동력을 잘 활용하는 플레이어입니다. 차량 하차 후 교전 능력을 보완하면 더욱 강력해집니다.";
  return "꾸준한 플레이가 실력 향상의 핵심입니다. 교전 후 복기를 통해 패턴을 파악하고 개선해나가세요.";
}

interface RawRankedMode {
  roundsPlayed: number;
  wins: number;
  kills: number;
  losses: number;
  damageDealt: number;
  currentTier: { tier: string; subTier: string };
  currentRankPoint: number;
  bestTier: { tier: string; subTier: string };
  bestRankPoint: number;
}

export function getAllRankedModeRows(
  rankedStats: Record<string, unknown>
): RankedModeRow[] {
  const tierStr = (t: { tier: string; subTier: string }) =>
    t.tier === "Unranked" ? "Unranked" : `${t.tier} ${t.subTier}`;

  return MODE_ORDER
    .filter((key) => ((rankedStats[key] as RawRankedMode)?.roundsPlayed ?? 0) > 0)
    .map((key) => {
      const m = rankedStats[key] as RawRankedMode;
      const meta = MODE_META[key] ?? { team: key, perspective: "-" };
      const deaths = Math.max(m.losses, 1);
      const games = Math.max(m.roundsPlayed, 1);
      return {
        key,
        team: meta.team,
        perspective: meta.perspective,
        gamesStr: m.roundsPlayed.toLocaleString(),
        kdStr: (m.kills / deaths).toFixed(2),
        winRateStr: ((m.wins / games) * 100).toFixed(1) + "%",
        avgDamageStr: Math.round(m.damageDealt / games).toString(),
        currentTier: tierStr(m.currentTier),
        currentRP: m.currentRankPoint,
        bestTier: tierStr(m.bestTier),
        bestRP: m.bestRankPoint,
      };
    });
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
  const squadplay = Math.min(100, Math.round(
    Math.min(s.assistsPerGame / 4, 1) * 50 + Math.min(s.revivesPerGame / 1, 1) * 30 + 20
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
