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

export interface WeaponRatio {
  nearPct: number;
  farPct: number;
  totalTracked: number;
}

export interface PlayerApiResponse {
  name: string;
  kd: string;
  kda: string;
  winRate: string;
  avgDamage: string;
  headshot: string;
  assistsPerGame: string;
  revivesPerGame: string;
  games: string;
  persona: Persona;
  weaponRatio?: WeaponRatio | null;
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
  activeGameType: "normal" | "ranked";
  activeTeam: "squad" | "duo" | "solo";
  availableNormalTeams: Array<"squad" | "duo" | "solo">;
  hasRanked: boolean;
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
  archetypeRadar: [number, number, number, number, number, number];
}> = [
  {
    id: "perfect",
    title: "완성형 인간, 인간의 탈을 쓴 무언가",
    titleEn: "PERFECT HUMAN",
    quote: "이 게임이 잘못된 건지, 당신이 너무 잘하는 건지. 어쨌든 당신 앞에 서면 다들 죽는다.",
    type: "APEX PREDATOR",
    tier: "DIAMOND",
    match: (s) => s.kd >= 5.0 && s.winRate >= 12 && s.avgDamage >= 500,
    archetypeRadar: [100, 49, 85, 98, 100, 98],
  },
  {
    id: "warlord",
    title: "전장의 지배자, 불멸의 수호신",
    titleEn: "LORD OF BATTLEFIELD",
    quote: "총구는 적을 향하고, 손은 동료를 향한다. 살육과 구원을 동시에 행하는 자, 이 전장에서 그는 신과 다름없다.",
    type: "IMMORTAL GUARDIAN",
    tier: "DIAMOND",
    match: (s) => s.kd >= 1.9 && s.revivesPerGame >= 0.4,
    archetypeRadar: [83, 77, 69, 89, 91, 80],
  },
  {
    id: "sense",
    title: "센스쟁이, 게임을 읽는 눈을 가진 자",
    titleEn: "SENSE MASTER",
    quote: "나 혼자 잘해봤자 지는 게임. 팀 전체를 이기게 하는 게 진짜 실력이다.",
    type: "IQ PLAYER",
    tier: "GOLD",
    match: (s) => s.kda >= 2.2 && s.assistsPerGame >= 0.6 && s.kd >= 2.0,
    archetypeRadar: [85, 61, 73, 91, 88, 85],
  },
  {
    id: "aim_god",
    title: "에임만 신, 뇌는 그냥 장식품",
    titleEn: "AIM GOD, BRAIN OPTIONAL",
    quote: "방아쇠만 당기면 된다. 나머지는... 팀원이 알아서 하겠지.",
    type: "MECHANICAL GENIUS",
    tier: "GOLD",
    match: (s) => s.kd >= 2.5 && s.assistsPerGame < 0.8 && s.avgDamage >= 280,
    archetypeRadar: [94, 40, 65, 83, 95, 89],
  },
  {
    id: "hotdrop",
    title: "핫드랍 광신도, 착지하자마자 전쟁이다",
    titleEn: "HOTDROP FANATIC",
    quote: "착지하자마자 총소리. 그게 좋다. 조용한 게임은 내 게임이 아니다.",
    type: "HOT DROP ADDICT",
    tier: "GOLD",
    match: (s) => s.kd >= 1.8 && s.avgDamage >= 220 && s.avgSurvivalMin < 12,
    archetypeRadar: [68, 51, 44, 70, 96, 77],
  },
  {
    id: "sniper",
    title: "저격의 신, 스코프 너머의 사형선고",
    titleEn: "GOD OF SNIPING",
    quote: "스코프 안에 들어온 순간, 이미 당신은 죽었다.",
    type: "PRECISION MARKSMAN",
    tier: "GOLD",
    match: (s) => s.headshotRate >= 26 && s.kd >= 1.5,
    archetypeRadar: [58, 52, 53, 82, 74, 74],
  },
  {
    id: "lone",
    title: "나만 살면 돼, 팀원은 그냥 구경꾼",
    titleEn: "LONE SURVIVOR",
    quote: "팀원이 쓰러졌다. 나는 계속 달린다. 미안하진 않다.",
    type: "LONE WOLF",
    tier: "SILVER",
    match: (s) => s.kd >= 1.2 && s.avgDamage >= 210 && s.avgSurvivalMin < 17 && s.revivesPerGame < 0.28,
    archetypeRadar: [57, 45, 44, 77, 80, 69],
  },
  {
    id: "assault",
    title: "돌격대장, 생각보다 총구가 먼저",
    titleEn: "ASSAULT COMMANDER",
    quote: "생각은 나중에. 일단 들어가고 본다. 안 되면 그때 생각한다.",
    type: "AGGRESSIVE RIFLER",
    tier: "GOLD",
    match: (s) => s.kd >= 1.2 && s.avgDamage >= 210 && s.avgSurvivalMin < 17,
    archetypeRadar: [55, 64, 48, 84, 78, 66],
  },
  {
    id: "zone_master",
    title: "자기장 마스터, 싸움 없이 이기는 자",
    titleEn: "ZONE MASTER",
    quote: "싸움은 안 한다. 자기장이 알아서 죽여주기 때문이다.",
    type: "SURVIVAL SPECIALIST",
    tier: "GOLD",
    match: (s) => s.winRate >= 6 && s.avgSurvivalMin >= 13 && s.kd >= 1.0,
    archetypeRadar: [42, 56, 65, 93, 47, 71],
  },
  {
    id: "vehicle",
    title: "탈것 장인, 바퀴가 곧 무기다",
    titleEn: "VEHICLE MASTER",
    quote: "두 발로 뛰는 건 시간 낭비다. 네 바퀴면 모든 게 해결된다.",
    type: "MOBILITY SPECIALIST",
    tier: "SILVER",
    match: (s) => s.rideDistPerGame >= 2100 && s.kd >= 0.8,
    archetypeRadar: [38, 54, 48, 92, 45, 65],
  },
  {
    id: "lucky_chicken",
    title: "어쩌다 치킨, 어떻게 이긴 건지 나도 모른다",
    titleEn: "ACCIDENTAL CHAMPION",
    quote: "총 싸움은 자신 없다. 그냥 숨어있었는데... 다들 죽어있었다.",
    type: "LUCKY SURVIVOR",
    tier: "SILVER",
    match: (s) => s.winRate >= 5 && s.kd < 1.0 && s.avgDamage < 170,
    archetypeRadar: [27, 53, 56, 84, 37, 65],
  },
  {
    id: "savior",
    title: "팀의 구원자, 쓰러진 자를 일으키는 손",
    titleEn: "TEAM SAVIOR",
    quote: "내가 살아있는 한, 팀원도 살아있다. 이게 내 전쟁이다.",
    type: "TACTICAL SUPPORT",
    tier: "SILVER",
    match: (s) => s.kd < 1.2 && s.revivesPerGame >= 0.35 && s.assistsPerGame >= 0.3,
    archetypeRadar: [35, 67, 39, 78, 55, 62],
  },
  {
    id: "twolegs",
    title: "두 발의 용사, 지도를 두 다리로 정복하는 자",
    titleEn: "TWO-LEGGED HERO",
    quote: "차는 시끄럽고 눈에 띈다. 걸어서 가면 아무도 모른다.",
    type: "GROUND WALKER",
    tier: "SILVER",
    match: (s) => s.walkDistPerGame >= 1200 && s.rideDistPerGame < 1200,
    archetypeRadar: [32, 42, 36, 65, 50, 72],
  },
  {
    id: "camper",
    title: "존버황제, 총소리 나면 일단 숨는다",
    titleEn: "KING OF CAMPING",
    quote: "총소리가 나면 숨는다. 자기장이 오면 피한다. 그게 전략의 전부다.",
    type: "PASSIVE SURVIVOR",
    tier: "BRONZE",
    match: (s) => s.top10Rate >= 18 && s.kd < 1.05,
    archetypeRadar: [30, 49, 34, 72, 50, 61],
  },
  {
    id: "grinder",
    title: "성실한 삽질러, 오늘도 내일도 지지만 멈추지 않는다",
    titleEn: "DEDICATED GRINDER",
    quote: "100판을 해도 아직 모르겠다. 그래도 내일 또 할 거다.",
    type: "PERSISTENT PLAYER",
    tier: "BRONZE",
    match: (s) => s.roundsPlayed >= 150 && s.kd < 1.5 && s.avgDamage < 185,
    archetypeRadar: [36, 47, 35, 63, 61, 71],
  },
  {
    id: "rookie",
    title: "4렙 가방, 아이템은 만렙 전투력은 1렙",
    titleEn: "LVL4 BACKPACK",
    quote: "아이템은 잘 모은다. 그걸 어떻게 쓰는지가... 아직 연구 중이다.",
    type: "DEVELOPING WARRIOR",
    tier: "BRONZE",
    match: () => true,
    archetypeRadar: [42, 50, 36, 67, 69, 68],
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
  deaths?: number;
  losses?: number;
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
      const rawDeaths = m.deaths ?? m.losses ?? (m.roundsPlayed - m.wins);
      const deaths = Math.max(isNaN(rawDeaths) ? m.roundsPlayed - m.wins : rawDeaths, 1);
      const games = Math.max(m.roundsPlayed, 1);
      const kills = m.kills ?? 0;
      return {
        key,
        team: meta.team,
        perspective: meta.perspective,
        gamesStr: m.roundsPlayed.toLocaleString(),
        kdStr: kills > 0 && deaths > 0 ? (kills / deaths).toFixed(2) : "—",
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
    Math.min(s.kd / 3, 1) * 60 + Math.min(s.avgDamage / 400, 1) * 40
  ));
  const teamwork = Math.min(100, Math.round(
    Math.min(s.assistsPerGame / 2, 1) * 40 +
    Math.min(s.revivesPerGame / 0.4, 1) * 45 + 15
  ));
  const survival = Math.min(100, Math.round(
    Math.min(s.winRate / 12, 1) * 55 + Math.min(s.avgSurvivalMin / 25, 1) * 45
  ));
  const management = Math.min(100, Math.round(
    Math.min(s.top10Rate / 40, 1) * 70 +
    Math.min((s.walkDistPerGame + s.rideDistPerGame) / 5000, 1) * 30
  ));
  const aggression = Math.min(100, Math.round(
    Math.min(s.avgDamage / Math.max(s.avgSurvivalMin, 0.5) / 25, 1) * 100
  ));
  const physical = Math.max(0, Math.min(100, Math.round(
    (280 - s.avgDamage / Math.max(s.kd, 0.1)) / 2
  )));
  return [combat, teamwork, survival, management, aggression, physical];
}

export function getAvailableNormalTeams(
  gameModeStats: Record<string, RawModeStats>
): Array<"squad" | "duo" | "solo"> {
  const g = (k: string) => gameModeStats[k]?.roundsPlayed ?? 0;
  const result: Array<"squad" | "duo" | "solo"> = [];
  if (g("squad-fpp") + g("squad") > 0) result.push("squad");
  if (g("duo-fpp") + g("duo") > 0) result.push("duo");
  if (g("solo-fpp") + g("solo") > 0) result.push("solo");
  return result;
}

export function extractTeamStats(
  gameModeStats: Record<string, RawModeStats>,
  team: "squad" | "duo" | "solo"
): { stats: RawModeStats; modeKey: string } | null {
  const fpp = gameModeStats[`${team}-fpp`];
  const tpp = gameModeStats[team];
  const fppG = fpp?.roundsPlayed ?? 0;
  const tppG = tpp?.roundsPlayed ?? 0;
  if (fppG === 0 && tppG === 0) return null;
  if (fppG >= tppG && fppG > 0) return { stats: fpp, modeKey: `${team}-fpp` };
  return { stats: tpp, modeKey: team };
}

export function adaptRankedToNormal(rankedStats: Record<string, unknown>): RawModeStats | null {
  for (const key of ["squad-fpp", "squad"]) {
    const m = rankedStats[key] as { roundsPlayed?: number; wins?: number; kills?: number; deaths?: number; losses?: number; damageDealt?: number } | undefined;
    if ((m?.roundsPlayed ?? 0) > 0) {
      return {
        kills: m!.kills ?? 0,
        assists: 0,
        dBNOs: 0,
        damageDealt: m!.damageDealt ?? 0,
        headshotKills: 0,
        longestTimeSurvived: 0,
        losses: m!.deaths || m!.losses || Math.max((m!.roundsPlayed ?? 1) - (m!.wins ?? 0), 1),
        roundsPlayed: m!.roundsPlayed ?? 0,
        timeSurvived: 0,
        top10s: 0,
        wins: m!.wins ?? 0,
        heals: 0,
        boosts: 0,
        revives: 0,
        longestKill: 0,
        rideDistance: 0,
        walkDistance: 0,
        roundMostKills: 0,
        vehicleDestroys: 0,
        teamKills: 0,
      };
    }
  }
  return null;
}

export function getPersonaArchetypeRadar(id: string): number[] {
  return PERSONA_DEFS.find((p) => p.id === id)?.archetypeRadar ?? [50, 50, 50, 50, 50, 50];
}

export function getPersonaStaticInfo(id: string) {
  const p = PERSONA_DEFS.find((d) => d.id === id);
  if (!p) return null;
  return {
    type: p.type,
    tier: p.tier,
  };
}
