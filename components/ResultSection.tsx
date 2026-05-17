"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PlayerApiResponse, ModeRow } from "@/lib/persona";

const AXES = ["Combat", "Survival", "Mobility", "Squadplay", "Consistency", "Adaptability"];

const TIER_COLOR: Record<string, string> = {
  DIAMOND: "#60a5fa",
  PLATINUM: "#00f5ff",
  GOLD: "#facc15",
  SILVER: "#94a3b8",
  BRONZE: "#cd7f32",
};

const FALLBACK: PlayerApiResponse = {
  name: "Unknown_Player",
  kd: "—", winRate: "—", avgDamage: "—", headshot: "—", games: "—",
  persona: {
    id: "rookie", title: "4렙 가방", titleEn: "LVL4 BACKPACK",
    quote: "아직 가방만 레벨4다. 하지만 시작했다.",
    type: "DEVELOPING WARRIOR", tier: "BRONZE",
  },
  radarValues: [30, 30, 30, 30, 30, 30],
  insights: [], recommendation: "",
  seasonId: "", seasonLabel: "",
  accountId: "", shard: "",
  modeKey: "", modeName: "",
  allModes: [], teammates: [],
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
        const p = pt(angle(i), v);
        return (
          <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 + i * 0.07 }}>
            <circle cx={p.x} cy={p.y} r={5} fill="rgba(99,179,237,0.12)" />
            <circle cx={p.x} cy={p.y} r={2.5} fill="#63b3ed" filter="url(#rr-dot)" />
          </motion.g>
        );
      })}
      {AXES.map((axis, i) => {
        const ang = angle(i);
        const lx = cx + r * 1.3 * Math.cos(ang), ly = cy + r * 1.3 * Math.sin(ang);
        const anchor = Math.cos(ang) < -0.1 ? "end" : Math.cos(ang) > 0.1 ? "start" : "middle";
        return (
          <motion.text key={axis} x={lx} y={ly} textAnchor={anchor} dominantBaseline="middle"
            fill="rgba(148,163,184,0.8)" fontSize="10" fontFamily="monospace" letterSpacing="1"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 + i * 0.06 }}>
            {axis.toUpperCase()}
          </motion.text>
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

interface Props {
  playerName: string;
  playerData: PlayerApiResponse | null;
  fetchError: string | null;
  seasonLoading: boolean;
  teammates: PlayerApiResponse["teammates"];
  teammatesLoading: boolean;
  onReset: () => void;
  onSeasonChange: (seasonId: string) => void;
}

export default function ResultSection({ playerName, playerData, fetchError, seasonLoading, teammates, teammatesLoading, onReset, onSeasonChange }: Props) {
  const [seasons, setSeasons] = useState<SeasonTab[]>([]);
  const [seasonError, setSeasonError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/seasons").then((r) => r.json()).then((data) => {
      if (Array.isArray(data)) setSeasons(data);
    }).catch(() => {});
  }, []);

  // Clear season error when new data arrives
  useEffect(() => { if (playerData) setSeasonError(null); }, [playerData]);
  useEffect(() => { if (fetchError) setSeasonError(fetchError); }, [fetchError]);

  const d = playerData ?? FALLBACK;
  const tierColor = TIER_COLOR[d.persona.tier] ?? "#94a3b8";
  const hasInitialError = !playerData && !!fetchError;

  const allTabs: SeasonTab[] = [
    { id: "lifetime", label: "전체", isCurrentSeason: false },
    ...seasons,
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
                    <div className="text-center p-3.5 rounded-sm border"
                      style={{ borderColor: `${tierColor}35`, background: `${tierColor}07` }}>
                      <p className="text-[9px] font-mono text-slate-600 tracking-widest mb-0.5">TIER</p>
                      <p className="text-xl font-bold" style={{ color: tierColor, textShadow: `0 0 14px ${tierColor}50` }}>
                        {d.persona.tier}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "K/D", value: d.kd },
                        { label: "WIN%", value: d.winRate },
                        { label: "AVG DMG", value: d.avgDamage },
                        { label: "HS%", value: d.headshot },
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

        {/* ─── ANALYSIS GRID ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
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
        </div>

        {/* ─── MODE BREAKDOWN TABLE ─── */}
        {d.allModes.length > 0 && (
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

        {/* ─── TEAMMATES ─── */}
        {(teammatesLoading || teammates.length > 0) && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.0 }}
            className="border border-white/8 rounded-sm mb-5 p-5"
            style={{ background: "rgba(10,15,30,0.9)" }}>
            <p className="text-[10px] font-mono text-slate-500 tracking-[0.2em] mb-3">// 최근 20경기 기준 함께 플레이한 팀원</p>
            {teammatesLoading && teammates.length === 0 ? (
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-600 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400/40 animate-ping" />
                팀원 정보 불러오는 중...
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {teammates.map((tm) => (
                  <button key={tm.accountId}
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: "smooth" });
                      window.dispatchEvent(new CustomEvent("gamecode:search", { detail: tm.name }));
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-sm border border-white/10 hover:border-blue-400/30 hover:bg-blue-500/8 transition-all group">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400/50 group-hover:bg-blue-400 transition-colors" />
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors font-mono">{tm.name}</span>
                    {tm.sharedMatches > 1 && (
                      <span className="text-[9px] font-mono text-blue-400/50 group-hover:text-blue-400/70 transition-colors">
                        {tm.sharedMatches}경기
                      </span>
                    )}
                    <span className="text-[10px] text-slate-600 group-hover:text-blue-400/60 transition-colors">→</span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ─── SHARE ─── */}
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
            <button className="px-4 py-2 text-xs font-mono font-bold text-white tracking-widest uppercase rounded-sm"
              style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", boxShadow: "0 0 18px rgba(59,130,246,0.3)" }}>
              공유하기
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
