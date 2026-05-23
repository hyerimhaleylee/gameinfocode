"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PlayerApiResponse, ModeRow, RankedModeRow } from "@/lib/persona";
import type { MatchEntry } from "@/lib/pubg";
import WeaponTab from "./WeaponTab";

const AXES = ["Combat", "Teamwork", "Survival", "Management", "Aggression", "Physical"];

const AXIS_META = [
  { kr: "전투력", desc: "KD + 딜량" },
  { kr: "팀워크", desc: "어시스트 + 부활" },
  { kr: "생존력", desc: "승률 + 생존시간" },
  { kr: "운영력", desc: "탑10 + 이동거리" },
  { kr: "공격성", desc: "시간당 딜량" },
  { kr: "피지컬", desc: "킬당 딜 효율" },
];

const FALLBACK: PlayerApiResponse = {
  name: "Unknown_Player",
  kd: "—", kda: "—", winRate: "—", avgDamage: "—", headshot: "—", assistsPerGame: "—", revivesPerGame: "—", games: "—",
  persona: {
    id: "rookie", title: "4렙 가방, 아이템은 만렙 전투력은 1렙", titleEn: "LVL4 BACKPACK",
    quote: "아이템은 잘 모은다. 그걸 어떻게 쓰는지가... 아직 연구 중이다.",
    type: "DEVELOPING WARRIOR", tier: "BRONZE",
  },
  radarValues: [30, 30, 30, 30, 30, 30],
  insights: [], recommendation: "",
  seasonId: "", seasonLabel: "",
  accountId: "", shard: "",
  modeKey: "", modeName: "",
  allModes: [],
  activeGameType: "normal",
  activeTeam: "squad",
  availableNormalTeams: [],
  hasRanked: false,
};

interface SeasonTab { id: string; label: string; isCurrentSeason: boolean; }

function ResultRadar({ values, size = 220 }: { values: number[]; size?: number }) {
  const cx = size / 2, cy = size / 2, r = size * 0.36, n = AXES.length;
  const levels = [0.25, 0.5, 0.75, 1.0];
  const angle = (i: number) => (2 * Math.PI * i) / n - Math.PI / 2;
  const pt = (ang: number, val: number) => ({
    x: cx + (val / 100) * r * Math.cos(ang),
    y: cy + (val / 100) * r * Math.sin(ang),
  });
  const grid = (lv: number) =>
    AXES.map((_, i) => { const p = pt(angle(i), 100 * lv); return `${p.x},${p.y}`; }).join(" ");
  const data = values.map((v, i) => { const p = pt(angle(i), v); return `${p.x},${p.y}`; }).join(" ");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
      <defs>
        <filter id="rr-glow"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <filter id="rr-dot"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <linearGradient id="rr-fill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(99,179,237,0.25)" />
          <stop offset="100%" stopColor="rgba(168,85,247,0.25)" />
        </linearGradient>
        <linearGradient id="rr-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#63b3ed" /><stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      {levels.map((lv, li) => (
        <polygon key={li} points={grid(lv)} fill="none"
          stroke={`rgba(99,179,237,${0.05 + li * 0.06})`} strokeWidth={lv === 1 ? 1 : 0.5} />
      ))}
      {AXES.map((_, i) => {
        const e = pt(angle(i), 100);
        return <line key={i} x1={cx} y1={cy} x2={e.x} y2={e.y} stroke="rgba(99,179,237,0.1)" strokeWidth="0.8" />;
      })}
      <motion.polygon points={data} fill="url(#rr-fill)" stroke="url(#rr-stroke)" strokeWidth="2"
        filter="url(#rr-glow)" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.8, ease: "easeOut" }}
        style={{ transformOrigin: `${cx}px ${cy}px` }} />
      {values.map((v, i) => {
        const ang = angle(i);
        const p = pt(ang, v);
        const scoreOffset = 14;
        const sx = p.x + scoreOffset * Math.cos(ang);
        const sy = p.y + scoreOffset * Math.sin(ang);
        const isLeft = Math.cos(ang) < -0.1;
        const isRight = Math.cos(ang) > 0.1;
        const anchor = isLeft ? "end" : isRight ? "start" : "middle";
        return (
          <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 + i * 0.07 }}>
            <circle cx={p.x} cy={p.y} r={5} fill="rgba(99,179,237,0.12)" />
            <circle cx={p.x} cy={p.y} r={2.5} fill="#63b3ed" filter="url(#rr-dot)" />
            <text x={sx} y={sy} textAnchor={anchor} dominantBaseline="middle"
              fill="#63b3ed" fontSize="9" fontFamily="monospace" fontWeight="bold">
              {v}
            </text>
          </motion.g>
        );
      })}
      {AXES.map((axis, i) => {
        const ang = angle(i);
        const lx = cx + r * 1.42 * Math.cos(ang);
        const ly = cy + r * 1.42 * Math.sin(ang);
        const anchor = Math.cos(ang) < -0.1 ? "end" : Math.cos(ang) > 0.1 ? "start" : "middle";
        const meta = AXIS_META[i];
        return (
          <motion.g key={axis} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 + i * 0.06 }}>
            <text x={lx} y={ly - 7} textAnchor={anchor} dominantBaseline="middle"
              fill="rgba(203,213,225,0.9)" fontSize="10" fontFamily="monospace" fontWeight="bold" letterSpacing="1">
              {meta.kr}
            </text>
            <text x={lx} y={ly + 7} textAnchor={anchor} dominantBaseline="middle"
              fill="rgba(100,116,139,0.7)" fontSize="8" fontFamily="monospace" letterSpacing="0.5">
              {meta.desc}
            </text>
          </motion.g>
        );
      })}
    </svg>
  );
}

function ModeTable({ rows }: { rows: ModeRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono">
        <thead>
          <tr className="border-b border-white/8">
            <th className="py-2 px-3 text-left text-slate-500 tracking-wider font-normal">팀구성</th>
            <th className="py-2 px-3 text-left text-slate-500 tracking-wider font-normal">시점</th>
            <th className="py-2 px-3 text-left text-slate-500 tracking-wider font-normal">게임 수</th>
            <th className="py-2 px-3 text-left text-slate-500 tracking-wider font-normal">K/D</th>
            <th className="py-2 px-3 text-left text-slate-500 tracking-wider font-normal">승률</th>
            <th className="py-2 px-3 text-left text-slate-500 tracking-wider font-normal">평균딜</th>
            <th className="py-2 px-3 text-left text-slate-500 tracking-wider font-normal">헤드샷</th>
            <th className="py-2 px-3 text-left text-slate-500 tracking-wider font-normal">TOP10</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <motion.tr key={row.key} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i }}
              className="border-b border-white/5 hover:bg-white/3 transition-colors">
              <td className="py-2.5 px-3 text-slate-200 font-medium">{row.team}</td>
              <td className="py-2.5 px-3 text-blue-300/70">{row.perspective}</td>
              <td className="py-2.5 px-3 text-slate-300">{row.gamesStr}</td>
              <td className="py-2.5 px-3 text-blue-300 font-semibold">{row.kdStr}</td>
              <td className="py-2.5 px-3 text-emerald-400">{row.winRateStr}</td>
              <td className="py-2.5 px-3 text-slate-300">{row.avgDamageStr}</td>
              <td className="py-2.5 px-3 text-amber-400">{row.headshotStr}</td>
              <td className="py-2.5 px-3 text-slate-400">{row.top10Str}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const RANKED_TIER_COLOR: Record<string, string> = {
  Unranked: "#475569",
  Bronze: "#cd7f32",
  Silver: "#94a3b8",
  Gold: "#facc15",
  Platinum: "#00f5ff",
  Diamond: "#60a5fa",
  Master: "#a855f7",
};

function getTierColor(tierStr: string) {
  const base = tierStr.split(" ")[0];
  return RANKED_TIER_COLOR[base] ?? "#94a3b8";
}

function RankedTable({ rows }: { rows: RankedModeRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono">
        <thead>
          <tr className="border-b border-white/8">
            {["팀구성", "시점", "게임 수", "현재 티어", "RP", "최고 티어", "K/D", "승률", "평균딜"].map((h) => (
              <th key={h} className="py-2 px-3 text-left text-slate-500 tracking-wider font-normal">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const tierColor = getTierColor(row.currentTier);
            return (
              <motion.tr key={row.key} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
                className="border-b border-white/5 hover:bg-white/3 transition-colors">
                <td className="py-2.5 px-3 text-slate-200 font-medium">{row.team}</td>
                <td className="py-2.5 px-3 text-blue-300/70">{row.perspective}</td>
                <td className="py-2.5 px-3 text-slate-300">{row.gamesStr}</td>
                <td className="py-2.5 px-3 font-semibold" style={{ color: tierColor, textShadow: `0 0 10px ${tierColor}60` }}>
                  {row.currentTier}
                </td>
                <td className="py-2.5 px-3 text-slate-300">{row.currentRP.toLocaleString()}</td>
                <td className="py-2.5 px-3 text-slate-500">{row.bestTier}</td>
                <td className="py-2.5 px-3 text-blue-300 font-semibold">{row.kdStr}</td>
                <td className="py-2.5 px-3 text-emerald-400">{row.winRateStr}</td>
                <td className="py-2.5 px-3 text-slate-300">{row.avgDamageStr}</td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}시간 전`;
  return `${Math.floor(diffHr / 24)}일 전`;
}

function formatSurvival(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function searchPlayer(name: string) {
  window.scrollTo({ top: 0, behavior: "smooth" });
  window.dispatchEvent(new CustomEvent("gamecode:search", { detail: name }));
}

function MatchCard({ match, delay }: { match: MatchEntry; delay: number }) {
  const pl = match.placement;
  const placementColor = pl === 1 ? "#facc15" : pl <= 5 ? "#4ade80" : pl <= 15 ? "#94a3b8" : "#475569";

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="border border-white/8 rounded-sm overflow-hidden"
      style={{ background: "rgba(10,18,40,0.7)" }}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5"
        style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold font-mono leading-none" style={{ color: placementColor }}>
            #{pl}
          </span>
          <div>
            <span className="text-sm text-white font-medium">{match.map}</span>
            <span className="text-[10px] font-mono text-slate-500 ml-2">{match.gameMode}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono text-slate-600">
          <span>/{match.totalParticipants}명</span>
          <span>{formatDate(match.date)}</span>
        </div>
      </div>

      <div className="px-4 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono border-b border-white/5">
        <span className="text-slate-300">킬 <span className="text-blue-300 font-bold">{match.kills}</span></span>
        <span className="text-slate-500">어시 {match.assists}</span>
        <span className="text-slate-300">딜 <span className="text-amber-300 font-semibold">{match.damage}</span></span>
        {match.headshots > 0 && (
          <span className="text-slate-500">헤드샷 {match.headshots}</span>
        )}
        <span className="text-slate-600">{formatSurvival(match.survivalTime)}</span>
      </div>

      {match.teammates.length > 0 && (
        <div className="px-4 py-2.5 flex flex-wrap gap-1.5">
          {match.teammates.map((tm) => (
            <button key={tm.accountId} onClick={() => searchPlayer(tm.name)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm border border-white/8 hover:border-blue-400/30 hover:bg-blue-500/8 transition-all group text-[11px] font-mono">
              <span className="text-slate-300 group-hover:text-white transition-colors">{tm.name}</span>
              <span className="text-slate-600 text-[9px]">{tm.kills}킬 {tm.damage}딜</span>
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

interface Props {
  playerName: string;
  playerData: PlayerApiResponse | null;
  fetchError: string | null;
  seasonLoading: boolean;
  matches: MatchEntry[];
  matchesLoading: boolean;
  onReset: () => void;
  onSeasonChange: (seasonId: string) => void;
  onModeChange: (gameType: "normal" | "ranked", team: "squad" | "duo" | "solo") => void;
}

export default function ResultSection({ playerName, playerData, fetchError, seasonLoading, matches, matchesLoading, onReset, onSeasonChange, onModeChange }: Props) {
  const [seasons, setSeasons] = useState<SeasonTab[]>([]);
  const [seasonError, setSeasonError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"stats" | "weapons">("stats");
  const [copied, setCopied] = useState(false);
  // Reset tab when player changes
  useEffect(() => {
    if (playerData?.accountId) setActiveTab("stats");
  }, [playerData?.accountId]);

  useEffect(() => {
    fetch("/api/seasons").then((r) => r.json()).then((data) => {
      if (Array.isArray(data)) setSeasons(data);
    }).catch(() => {});
  }, []);

  // Clear season error when new data arrives
  useEffect(() => { if (playerData) setSeasonError(null); }, [playerData]);
  useEffect(() => { if (fetchError) setSeasonError(fetchError); }, [fetchError]);

  const d = playerData ?? FALLBACK;
  const rankedTierData = d.rankedTier ?? null;
  const rankedColor = rankedTierData ? getTierColor(rankedTierData.tier) : null;
  const hasInitialError = !playerData && !!fetchError;

  const frequentTeammates = useMemo(() => {
    const counts = new Map<string, { name: string; accountId: string; count: number }>();
    for (const m of matches) {
      for (const t of m.teammates) {
        const ex = counts.get(t.accountId);
        if (ex) ex.count++;
        else counts.set(t.accountId, { name: t.name, accountId: t.accountId, count: 1 });
      }
    }
    return Array.from(counts.values()).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [matches]);

  const allTabs: SeasonTab[] = [
    ...seasons,
    { id: "lifetime", label: "전체", isCurrentSeason: false },
  ];
  const activeSeasonId = playerData?.seasonId ?? "";

  const handleSeasonClick = (tabId: string) => {
    if (tabId === activeSeasonId || seasonLoading) return;
    setSeasonError(null);
    onSeasonChange(tabId);
  };

  return (
    <section className="min-h-screen px-4 py-20 relative overflow-hidden">
      <div className="absolute inset-0 tactical-grid opacity-10" />
      <div className="scan-lines" />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Back */}
        <motion.button initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }} onClick={onReset}
          className="flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-blue-400 transition-colors mb-6 tracking-widest uppercase">
          ← 다른 플레이어 분석
        </motion.button>

        {/* Season Selector */}
        {allTabs.length > 1 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }} className="mb-5 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono text-slate-600 tracking-widest mr-1">SEASON</span>
            {allTabs.map((tab) => {
              const isActive = activeSeasonId === tab.id;
              return (
                <button key={tab.id} onClick={() => handleSeasonClick(tab.id)} disabled={seasonLoading}
                  className={`px-3 py-1 text-[10px] font-mono tracking-wider border transition-all rounded-sm ${
                    isActive
                      ? "border-blue-400/60 text-blue-300 bg-blue-500/12"
                      : "border-white/10 text-slate-500 hover:border-slate-400/30 hover:text-slate-300"
                  } ${seasonLoading ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}>
                  {tab.label}
                  {tab.isCurrentSeason && <span className="ml-1 text-[8px] text-blue-400/60">NOW</span>}
                </button>
              );
            })}
            {seasonLoading && (
              <span className="text-[10px] font-mono text-blue-400/60 tracking-widest animate-pulse ml-1">LOADING...</span>
            )}
          </motion.div>
        )}

        {/* ─── MODE / TEAM TABS ─── */}
        {playerData && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
            className="mb-4 flex flex-col gap-2">

            {/* TYPE row — show whenever at least one type has data */}
            {(playerData.availableNormalTeams.length > 0 || playerData.hasRanked) && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono text-slate-600 tracking-widest mr-1">TYPE</span>
                {playerData.availableNormalTeams.length > 0 && (
                  <button
                    onClick={() => {
                      if (playerData.activeGameType === "normal" || seasonLoading) return;
                      onModeChange("normal", playerData.availableNormalTeams[0] ?? "squad");
                    }}
                    disabled={seasonLoading}
                    className={`px-3 py-1 text-[10px] font-mono tracking-wider border transition-all rounded-sm ${
                      playerData.activeGameType === "normal"
                        ? "border-blue-400/60 text-blue-300 bg-blue-500/12"
                        : "border-white/10 text-slate-500 hover:border-slate-400/30 hover:text-slate-300"
                    } ${seasonLoading ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}>
                    일반전
                  </button>
                )}
                {playerData.hasRanked && (
                  <button
                    onClick={() => {
                      if (playerData.activeGameType === "ranked" || seasonLoading) return;
                      onModeChange("ranked", "squad");
                    }}
                    disabled={seasonLoading}
                    className={`px-3 py-1 text-[10px] font-mono tracking-wider border transition-all rounded-sm ${
                      playerData.activeGameType === "ranked"
                        ? "border-amber-400/60 text-amber-300 bg-amber-500/10"
                        : "border-white/10 text-slate-500 hover:border-slate-400/30 hover:text-slate-300"
                    } ${seasonLoading ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}>
                    경쟁전
                  </button>
                )}
              </div>
            )}

            {/* TEAM row — show for normal mode whenever teams exist (even one) */}
            {playerData.activeGameType === "normal" && playerData.availableNormalTeams.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono text-slate-600 tracking-widest mr-1">TEAM</span>
                {playerData.availableNormalTeams.map((team) => (
                  <button key={team}
                    onClick={() => {
                      if (team === playerData.activeTeam || seasonLoading) return;
                      onModeChange("normal", team);
                    }}
                    disabled={seasonLoading}
                    className={`px-3 py-1 text-[10px] font-mono tracking-wider border transition-all rounded-sm ${
                      playerData.activeTeam === team
                        ? "border-cyan-400/60 text-cyan-300 bg-cyan-500/10"
                        : "border-white/10 text-slate-500 hover:border-slate-400/30 hover:text-slate-300"
                    } ${seasonLoading ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}>
                    {team === "squad" ? "스쿼드" : team === "duo" ? "듀오" : "솔로"}
                  </button>
                ))}
              </div>
            )}

            {/* Ranked notice */}
            {playerData.activeGameType === "ranked" && (
              <p className="text-[10px] font-mono text-slate-600">
                // 경쟁전 기준 — 헤드샷·어시스트·부활은 PUBG API 미제공으로 집계에서 제외됩니다.
              </p>
            )}
          </motion.div>
        )}

        {/* Season switch error (inline, not blocking) */}
        <AnimatePresence>
          {seasonError && playerData && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 px-4 py-2.5 rounded-sm border border-amber-500/25 flex items-center gap-3"
              style={{ background: "rgba(245,158,11,0.06)" }}>
              <span className="text-amber-400 text-xs">⚠</span>
              <p className="text-amber-300/80 text-xs font-mono">{seasonError}</p>
              <button onClick={() => setSeasonError(null)} className="ml-auto text-slate-500 hover:text-slate-300 text-xs">✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Initial scan error */}
        {hasInitialError && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-5 border border-red-500/25 text-center rounded-sm"
            style={{ background: "rgba(239,68,68,0.06)" }}>
            <p className="text-red-400 font-mono text-sm tracking-wider mb-1">SCAN FAILED</p>
            <p className="text-slate-400 text-sm">{fetchError}</p>
            <button onClick={onReset}
              className="mt-4 px-4 py-2 text-xs font-mono text-blue-400 border border-blue-500/30 hover:bg-blue-500/10 transition-all tracking-widest uppercase rounded-sm">
              다시 시도
            </button>
          </motion.div>
        )}

        {/* ─── TAB SELECTOR ─── */}
        {playerData && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="mb-5 flex items-center gap-1 border-b border-white/6 pb-0">
            {(["stats", "weapons"] as const).map((tab) => {
              const labels = { stats: "전적 분석", weapons: "무기 분석" };
              const isActive = activeTab === tab;
              return (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 text-[11px] font-mono tracking-wider border-b-2 transition-all -mb-px ${
                    isActive
                      ? "border-cyan-400 text-cyan-300"
                      : "border-transparent text-slate-500 hover:text-slate-300"
                  }`}>
                  {labels[tab]}
                </button>
              );
            })}
          </motion.div>
        )}

        {/* ─── PERSONA CARD ─── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.6, 1] }}
          transition={{ duration: 0.4 }} className="relative mb-6 overflow-hidden">
          <motion.div className="absolute left-0 right-0 h-px z-20 pointer-events-none"
            style={{ background: "linear-gradient(90deg, transparent, rgba(99,179,237,0.8) 40%, rgba(168,85,247,0.6) 60%, transparent)", boxShadow: "0 0 20px rgba(99,179,237,0.5)" }}
            initial={{ top: "0%" }} animate={{ top: "110%" }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} />

          <motion.div initial={{ clipPath: "inset(0 0 100% 0)" }} animate={{ clipPath: "inset(0 0 0% 0)" }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}>
            <div className={`border border-blue-500/20 rounded-sm relative transition-opacity duration-300 ${seasonLoading ? "opacity-40" : ""}`}
              style={{ background: "linear-gradient(135deg, rgba(10,15,35,0.98) 0%, rgba(12,8,30,0.96) 100%)", boxShadow: "0 0 50px rgba(99,179,237,0.06), inset 0 0 60px rgba(0,0,0,0.4)" }}>

              {/* HUD corners — subtler */}
              {["top-2 left-2 border-l border-t", "top-2 right-2 border-r border-t",
                "bottom-2 left-2 border-l border-b", "bottom-2 right-2 border-r border-b"].map((cls, i) => (
                <div key={i} className={`absolute w-4 h-4 ${cls} border-blue-400/30`} />
              ))}

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-2.5 border-b border-white/6"
                style={{ background: "rgba(99,179,237,0.03)" }}>
                <span className="text-[10px] font-mono text-blue-400/50 tracking-[0.2em] uppercase">
                  GAMECODE ANALYSIS
                </span>
                <div className="flex items-center gap-3">
                  {d.modeName && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm border border-blue-400/20 text-blue-300/70 tracking-wider">
                      {d.modeName} 기준
                    </span>
                  )}
                  {d.seasonLabel && (
                    <span className="text-[10px] font-mono text-slate-600 tracking-widest">{d.seasonLabel}</span>
                  )}
                  <div className="flex items-center gap-1.5">
                    <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  </div>
                </div>
              </div>

              <div className="p-5 md:p-7">
                <div className="flex flex-col md:flex-row gap-7">
                  {/* Left */}
                  <div className="flex-1">
                    <p className="text-[10px] font-mono text-slate-600 tracking-[0.2em] mb-1">TARGET</p>
                    <h2 className="text-3xl font-bold text-white tracking-wide mb-5">
                      {(playerData?.name ?? playerName).toUpperCase() || "UNKNOWN"}
                    </h2>

                    <div className="h-px mb-4" style={{ background: "linear-gradient(90deg, rgba(99,179,237,0.25), transparent)" }} />

                    <p className="text-[10px] font-mono text-slate-600 tracking-[0.2em] mb-1.5">PERSONA</p>
                    <h3 className="text-2xl md:text-3xl font-bold mb-1"
                      style={{ color: "#63b3ed", textShadow: "0 0 20px rgba(99,179,237,0.4)" }}>
                      {d.persona.title}
                    </h3>
                    <p className="text-[11px] font-mono text-blue-400/40 tracking-[0.18em] mb-4">{d.persona.titleEn}</p>

                    <div className="relative pl-3 mb-5">
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full"
                        style={{ background: "linear-gradient(180deg, #63b3ed, #a855f7)" }} />
                      <p className="text-slate-300 text-sm italic leading-relaxed">"{d.persona.quote}"</p>
                    </div>

                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-violet-500/25"
                      style={{ background: "rgba(168,85,247,0.07)" }}>
                      <span className="w-1 h-1 rounded-full bg-violet-400" />
                      <span className="text-[11px] font-mono font-semibold tracking-widest text-violet-300">{d.persona.type}</span>
                    </div>
                  </div>

                  {/* Right: stats */}
                  <div className="md:w-52 flex flex-col gap-3">
                    {rankedTierData && rankedColor ? (
                      <div className="text-center p-3.5 rounded-sm border"
                        style={{ borderColor: `${rankedColor}35`, background: `${rankedColor}07` }}>
                        <p className="text-[9px] font-mono text-slate-600 tracking-widest mb-0.5">RANKED TIER</p>
                        <p className="text-xl font-bold leading-tight" style={{ color: rankedColor, textShadow: `0 0 14px ${rankedColor}50` }}>
                          {rankedTierData.tier}
                        </p>
                        <p className="text-[10px] font-mono" style={{ color: `${rankedColor}99` }}>
                          {rankedTierData.subTier}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center p-3.5 rounded-sm border border-white/8"
                        style={{ background: "rgba(255,255,255,0.02)" }}>
                        <p className="text-[9px] font-mono text-slate-600 tracking-widest mb-0.5">RANKED TIER</p>
                        <p className="text-sm font-mono text-slate-600">미배치</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "K/D", value: d.kd },
                        { label: "KDA", value: d.kda },
                        { label: "WIN%", value: d.winRate },
                        { label: "AVG DMG", value: d.avgDamage },
                        { label: "HS%", value: d.headshot },
                        { label: "ASSISTS/G", value: d.assistsPerGame },
                        { label: "REVIVES/G", value: d.revivesPerGame },
                      ].map((s) => (
                        <div key={s.label} className="p-2.5 rounded-sm border border-white/6 text-center"
                          style={{ background: "rgba(255,255,255,0.025)" }}>
                          <p className="text-[9px] font-mono text-slate-600 tracking-widest mb-0.5">{s.label}</p>
                          <p className="text-sm font-bold text-white">{s.value}</p>
                        </div>
                      ))}
                    </div>

                    <p className="text-center text-[10px] font-mono text-slate-600">{d.games} MATCHES</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* ─── WEAPON TAB ─── */}
        {activeTab === "weapons" && playerData && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
            className="mb-6">
            <WeaponTab accountId={playerData.accountId} shard={playerData.shard} />
          </motion.div>
        )}

        {/* ─── ANALYSIS GRID ─── */}
        {activeTab === "stats" && <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }}
            className="border border-blue-500/12 p-5 rounded-sm"
            style={{ background: "rgba(10,18,40,0.85)" }}>
            <p className="text-[10px] font-mono text-blue-400/50 tracking-[0.2em] mb-4">// COMBAT PROFILE</p>
            <div className="flex items-center justify-center">
              <ResultRadar values={d.radarValues} size={220} />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6 }}
            className="border border-violet-500/12 p-5 rounded-sm"
            style={{ background: "rgba(12,8,28,0.85)" }}>
            <p className="text-[10px] font-mono text-violet-400/50 tracking-[0.2em] mb-4">// AI ANALYSIS</p>

            {d.insights.length > 0 ? (
              <div className="space-y-2.5 mb-4">
                {d.insights.map((ins, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.8 + i * 0.08 }} className="flex items-start gap-2.5">
                    <span className={`text-xs font-mono flex-shrink-0 mt-0.5 ${
                      ins.type === "positive" ? "text-blue-400" :
                      ins.type === "warning" ? "text-amber-400" : "text-slate-500"}`}>
                      {ins.type === "positive" ? "▲" : ins.type === "warning" ? "▼" : "◈"}
                    </span>
                    <p className="text-sm text-slate-300 leading-relaxed">{ins.text}</p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-slate-600 text-sm mb-4">분석 데이터가 부족합니다.</p>
            )}

            {d.recommendation && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.4 }}
                className="p-3 rounded-sm border border-violet-500/15"
                style={{ background: "rgba(168,85,247,0.06)" }}>
                <p className="text-[9px] font-mono text-violet-400/40 tracking-widest mb-1.5">AI RECOMMENDATION</p>
                <p className="text-sm text-slate-200 leading-relaxed italic">"{d.recommendation}"</p>
              </motion.div>
            )}
          </motion.div>
        </div>}

        {/* ─── STATS-ONLY SECTIONS ─── */}
        {activeTab === "stats" && d.allModes.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.8 }}
            className="border border-white/8 rounded-sm mb-5 overflow-hidden"
            style={{ background: "rgba(10,15,30,0.9)" }}>
            <div className="px-5 py-3 border-b border-white/6 flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-500 tracking-[0.2em]">// 모드별 스탯</span>
              <span className="text-[9px] font-mono text-slate-700 ml-auto">일반전 기준</span>
            </div>
            <div className="p-2">
              <ModeTable rows={d.allModes} />
            </div>
          </motion.div>
        )}

        {/* ─── RANKED STATS ─── */}
        {activeTab === "stats" && d.rankedModes && d.rankedModes.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.9 }}
            className="border border-amber-500/15 rounded-sm mb-5 overflow-hidden"
            style={{ background: "rgba(10,15,30,0.9)" }}>
            <div className="px-5 py-3 border-b border-amber-500/10 flex items-center gap-2">
              <span className="text-[10px] font-mono text-amber-400/60 tracking-[0.2em]">// 랭크드 스탯</span>
              <span className="text-[9px] font-mono text-slate-700 ml-auto">일반전과 별도 집계</span>
            </div>
            <div className="p-2">
              <RankedTable rows={d.rankedModes} />
            </div>
          </motion.div>
        )}

        {/* Season hint when no ranked data and viewing specific season */}
        {activeTab === "stats" && !d.rankedModes && d.seasonId && d.seasonId !== "lifetime" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.9 }}
            className="mb-5 px-4 py-3 border border-white/5 rounded-sm flex items-center gap-2"
            style={{ background: "rgba(255,255,255,0.02)" }}>
            <span className="text-slate-600 text-[10px] font-mono tracking-wider">// 랭크드</span>
            <span className="text-slate-600 text-[10px] font-mono">해당 시즌에 랭크드 기록이 없습니다.</span>
          </motion.div>
        )}

        {/* ─── 자주 함께한 플레이어 ─── */}
        {activeTab === "stats" && frequentTeammates.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.0 }}
            className="border border-white/8 rounded-sm mb-5 overflow-hidden"
            style={{ background: "rgba(10,15,30,0.9)" }}>
            <div className="px-5 py-3 border-b border-white/6 flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-500 tracking-[0.2em]">// 자주 함께한 플레이어</span>
              <span className="text-[9px] font-mono text-slate-700 ml-auto">최근 {matches.length}경기 기준</span>
            </div>
            <div className="p-4 flex flex-wrap gap-2">
              {frequentTeammates.map((tm, i) => (
                <motion.button key={tm.accountId} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.04 * i }}
                  onClick={() => searchPlayer(tm.name)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-sm border border-white/10 hover:border-blue-400/35 hover:bg-blue-500/8 transition-all group text-xs font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400/40 group-hover:bg-blue-400 transition-colors flex-shrink-0" />
                  <span className="text-slate-200 group-hover:text-white transition-colors">{tm.name}</span>
                  <span className="text-[10px] text-blue-400/50 group-hover:text-blue-400/80 transition-colors">{tm.count}경기</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ─── MATCH HISTORY ─── */}
        {activeTab === "stats" && (matchesLoading || matches.length > 0) && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.0 }}
            className="border border-white/8 rounded-sm mb-5 overflow-hidden"
            style={{ background: "rgba(10,15,30,0.9)" }}>
            <div className="px-5 py-3 border-b border-white/6 flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-500 tracking-[0.2em]">// 최근 경기</span>
              {matchesLoading && (
                <span className="flex items-center gap-1.5 text-[10px] font-mono text-blue-400/50 animate-pulse ml-2">
                  <span className="w-1 h-1 rounded-full bg-blue-400/50 animate-ping" />
                  불러오는 중...
                </span>
              )}
            </div>
            <div className="p-3 flex flex-col gap-2">
              {matches.map((m, i) => (
                <MatchCard key={m.matchId} match={m} delay={0.05 * i} />
              ))}
            </div>

          </motion.div>
        )}

        {/* ─── SHARE ─── */}
        {activeTab === "stats" && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.2 }}
            className="border border-white/6 rounded-sm p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ background: "rgba(255,255,255,0.02)" }}>
            <div>
              <p className="text-white font-semibold text-sm mb-0.5">결과를 친구에게 공유해보세요</p>
              <p className="text-slate-500 text-xs">스크린샷 찍어서 디스코드·카카오톡에 공유하면 반응 보장</p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <button onClick={onReset}
                className="px-4 py-2 text-xs font-mono border border-blue-500/30 text-blue-400 tracking-widest uppercase hover:bg-blue-500/10 transition-all rounded-sm">
                다시 분석
              </button>
              <button
                onClick={() => {
                  const url = `${window.location.origin}/?q=${encodeURIComponent(d.name)}`;
                  const onSuccess = () => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  };
                  const fallback = () => {
                    try {
                      const el = document.createElement("textarea");
                      el.value = url;
                      el.style.position = "fixed";
                      el.style.opacity = "0";
                      document.body.appendChild(el);
                      el.select();
                      document.execCommand("copy");
                      document.body.removeChild(el);
                      onSuccess();
                    } catch {
                      window.prompt("링크를 복사하세요", url);
                    }
                  };
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(url).then(onSuccess).catch(fallback);
                  } else {
                    fallback();
                  }
                }}
                className="relative px-4 py-2 text-xs font-mono font-bold text-white tracking-widest uppercase rounded-sm transition-all"
                style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", boxShadow: "0 0 18px rgba(59,130,246,0.3)" }}>
                {copied ? "복사됨 ✓" : "공유하기"}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
