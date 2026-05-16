"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { PlayerApiResponse } from "@/lib/persona";

const AXES = ["Combat", "Survival", "Mobility", "Squadplay", "Consistency", "Adaptability"];

const TIER_COLOR: Record<string, string> = {
  DIAMOND: "#60a5fa",
  PLATINUM: "#00f5ff",
  GOLD: "#facc15",
  SILVER: "#94a3b8",
  BRONZE: "#a16207",
};

const FALLBACK: PlayerApiResponse = {
  name: "Unknown_Player",
  kd: "—",
  winRate: "—",
  avgDamage: "—",
  headshot: "—",
  games: "—",
  persona: {
    id: "rookie",
    title: "4렙 가방",
    titleEn: "LVL4 BACKPACK",
    quote: "아직 가방만 레벨4다. 하지만 시작했다.",
    type: "DEVELOPING WARRIOR",
    tier: "BRONZE",
  },
  radarValues: [30, 30, 30, 30, 30, 30],
  insights: [],
  recommendation: "",
  seasonId: "",
  seasonLabel: "",
};

interface SeasonTab {
  id: string;
  label: string;
  isCurrentSeason: boolean;
}

function ResultRadar({ values, size = 240 }: { values: number[]; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.36;
  const n = AXES.length;
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
        <filter id="rr-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="rr-dot" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <linearGradient id="rr-fill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(0,245,255,0.22)" />
          <stop offset="100%" stopColor="rgba(168,85,247,0.22)" />
        </linearGradient>
        <linearGradient id="rr-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00f5ff" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      {levels.map((lv, li) => (
        <polygon key={li} points={grid(lv)} fill="none"
          stroke={`rgba(0,245,255,${0.04 + li * 0.05})`}
          strokeWidth={lv === 1 ? 1 : 0.5} />
      ))}
      {AXES.map((_, i) => {
        const e = pt(angle(i), 100);
        return <line key={i} x1={cx} y1={cy} x2={e.x} y2={e.y} stroke="rgba(0,245,255,0.07)" strokeWidth="0.8" />;
      })}
      <motion.polygon points={data} fill="url(#rr-fill)" stroke="url(#rr-stroke)" strokeWidth="2"
        filter="url(#rr-glow)"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.8, ease: "easeOut" }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />
      {values.map((v, i) => {
        const p = pt(angle(i), v);
        return (
          <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 + i * 0.07 }}>
            <circle cx={p.x} cy={p.y} r={5} fill="rgba(0,245,255,0.08)" />
            <circle cx={p.x} cy={p.y} r={2.5} fill="#00f5ff" filter="url(#rr-dot)" />
          </motion.g>
        );
      })}
      {AXES.map((axis, i) => {
        const ang = angle(i);
        const lx = cx + r * 1.3 * Math.cos(ang);
        const ly = cy + r * 1.3 * Math.sin(ang);
        const anchor = Math.cos(ang) < -0.1 ? "end" : Math.cos(ang) > 0.1 ? "start" : "middle";
        return (
          <motion.text key={axis} x={lx} y={ly} textAnchor={anchor} dominantBaseline="middle"
            fill="rgba(148,163,184,0.7)" fontSize="10" fontFamily="monospace" letterSpacing="1.5"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 + i * 0.06 }}>
            {axis.toUpperCase()}
          </motion.text>
        );
      })}
    </svg>
  );
}

interface Props {
  playerName: string;
  playerData: PlayerApiResponse | null;
  fetchError: string | null;
  seasonLoading: boolean;
  onReset: () => void;
  onSeasonChange: (seasonId: string) => void;
}

export default function ResultSection({ playerName, playerData, fetchError, seasonLoading, onReset, onSeasonChange }: Props) {
  const [scanDone, setScanDone] = useState(false);
  const [seasons, setSeasons] = useState<SeasonTab[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setScanDone(true), 1600);
    return () => clearTimeout(t);
  }, []);

  // Fetch seasons list once on mount
  useEffect(() => {
    fetch("/api/seasons")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setSeasons(data);
      })
      .catch(() => {});
  }, []);

  const d = playerData ?? FALLBACK;
  const tierColor = TIER_COLOR[d.persona.tier] ?? "#94a3b8";
  const hasError = !playerData && !!fetchError;
  const activeSeasonId = playerData?.seasonId ?? "";

  const allTabs: SeasonTab[] = [
    { id: "lifetime", label: "전체", isCurrentSeason: false },
    ...seasons,
  ];

  return (
    <section className="min-h-screen px-4 py-20 relative overflow-hidden">
      <div className="absolute inset-0 tactical-grid opacity-20" />
      <div className="scan-lines" />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Back */}
        <motion.button
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          onClick={onReset}
          className="flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-cyan-400 transition-colors mb-8 tracking-widest uppercase"
        >
          ← Analyze Another Player
        </motion.button>

        {/* ─── SEASON SELECTOR ─── */}
        {allTabs.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-6 flex items-center gap-2 flex-wrap"
          >
            <span className="text-[10px] font-mono text-slate-600 tracking-widest mr-1">SEASON</span>
            {allTabs.map((tab) => {
              const isActive = activeSeasonId === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => !isActive && !seasonLoading && onSeasonChange(tab.id)}
                  disabled={seasonLoading}
                  className={`px-3 py-1 text-[10px] font-mono tracking-wider border transition-all ${
                    isActive
                      ? "border-cyan-500/60 text-cyan-400 bg-cyan-500/10"
                      : "border-white/10 text-slate-500 hover:border-slate-500/40 hover:text-slate-300"
                  } ${seasonLoading ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  {tab.label}
                  {tab.isCurrentSeason && <span className="ml-1 text-[8px] text-cyan-500/60">NOW</span>}
                </button>
              );
            })}
            {seasonLoading && (
              <span className="text-[10px] font-mono text-cyan-400/60 tracking-widest animate-pulse ml-1">
                LOADING...
              </span>
            )}
          </motion.div>
        )}

        {/* Error state */}
        {hasError && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-5 border border-red-500/25 text-center"
            style={{ background: "rgba(239,68,68,0.06)" }}
          >
            <p className="text-red-400 font-mono text-sm tracking-wider mb-1">SCAN FAILED</p>
            <p className="text-slate-400 text-sm">{fetchError}</p>
            <button
              onClick={onReset}
              className="mt-4 px-4 py-2 text-xs font-mono text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/10 transition-all tracking-widest uppercase"
            >
              다시 시도
            </button>
          </motion.div>
        )}

        {/* ─── PERSONA CARD ─── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.5, 1, 0.8, 1] }}
          transition={{ duration: 0.45, times: [0, 0.15, 0.3, 0.5, 0.75, 1] }}
          className="relative mb-8 overflow-hidden"
        >
          {/* Scan line */}
          <motion.div
            className="absolute left-0 right-0 h-0.5 z-20 pointer-events-none"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(0,245,255,0.9) 40%, rgba(168,85,247,0.7) 60%, transparent)",
              boxShadow: "0 0 24px rgba(0,245,255,0.6)",
            }}
            initial={{ top: "0%" }}
            animate={{ top: "110%" }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          />

          <motion.div
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className={`border border-cyan-500/20 relative transition-opacity duration-300 ${seasonLoading ? "opacity-40" : "opacity-100"}`}
              style={{
                background: "linear-gradient(135deg, rgba(0,10,20,0.97) 0%, rgba(5,5,25,0.95) 100%)",
                boxShadow: "0 0 60px rgba(0,245,255,0.07), inset 0 0 80px rgba(0,0,0,0.5)",
              }}>
              {/* HUD corners */}
              {["top-3 left-3 border-l border-t", "top-3 right-3 border-r border-t",
                "bottom-3 left-3 border-l border-b", "bottom-3 right-3 border-r border-b"].map((cls, i) => (
                <div key={i} className={`absolute w-5 h-5 ${cls} border-cyan-500/40`} />
              ))}

              {/* Header bar */}
              <div className="flex items-center justify-between px-6 py-3 border-b border-cyan-500/10"
                style={{ background: "rgba(0,245,255,0.03)" }}>
                <span className="text-[10px] font-mono text-cyan-400/60 tracking-[0.25em] uppercase">
                  GAMECODE ANALYSIS REPORT
                </span>
                <div className="flex items-center gap-3">
                  {d.seasonLabel && (
                    <span className="text-[10px] font-mono text-slate-600 tracking-widest">{d.seasonLabel}</span>
                  )}
                  <div className="flex items-center gap-2">
                    <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span className="text-[10px] font-mono text-slate-600 tracking-widest">REPORT GENERATED</span>
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Left: identity */}
                  <div className="flex-1">
                    <p className="text-[10px] font-mono text-slate-600 tracking-[0.25em] mb-1">TARGET IDENTIFIED</p>
                    <h2 className="text-4xl font-bold text-white tracking-wider mb-6">
                      {(playerData?.name ?? playerName).toUpperCase() || "UNKNOWN_PLAYER"}
                    </h2>

                    <div className="h-px mb-5" style={{ background: "linear-gradient(90deg, rgba(0,245,255,0.2), transparent)" }} />

                    <p className="text-[10px] font-mono text-slate-600 tracking-[0.25em] mb-2">PRIMARY PERSONA</p>
                    <h3 className="text-3xl md:text-4xl font-bold mb-1 leading-tight"
                      style={{ color: "#00f5ff", textShadow: "0 0 20px rgba(0,245,255,0.5), 0 0 40px rgba(0,245,255,0.2)" }}>
                      {d.persona.title}
                    </h3>
                    <p className="text-xs font-mono text-cyan-400/50 tracking-[0.2em] mb-5">{d.persona.titleEn}</p>

                    <div className="relative pl-4 mb-6">
                      <div className="absolute left-0 top-0 bottom-0 w-0.5"
                        style={{ background: "linear-gradient(180deg, #00f5ff, #a855f7)" }} />
                      <p className="text-slate-300 text-sm italic leading-relaxed">"{d.persona.quote}"</p>
                    </div>

                    <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-purple-500/30"
                      style={{ background: "rgba(168,85,247,0.08)" }}>
                      <span className="w-1 h-1 rounded-full bg-purple-400" />
                      <span className="text-xs font-mono font-bold tracking-widest text-purple-400">{d.persona.type}</span>
                    </div>
                  </div>

                  {/* Right: stats */}
                  <div className="md:w-56 flex flex-col gap-4">
                    <div className="text-center p-4 border"
                      style={{
                        borderColor: `${tierColor}40`,
                        background: `${tierColor}08`,
                      }}>
                      <p className="text-[10px] font-mono text-slate-600 tracking-widest mb-1">TIER</p>
                      <p className="text-2xl font-bold" style={{ color: tierColor, textShadow: `0 0 16px ${tierColor}60` }}>
                        {d.persona.tier}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "K/D RATIO", value: d.kd },
                        { label: "WIN RATE", value: d.winRate },
                        { label: "AVG DMG", value: d.avgDamage },
                        { label: "HEADSHOT%", value: d.headshot },
                      ].map((s) => (
                        <div key={s.label} className="p-2.5 border border-white/5 text-center"
                          style={{ background: "rgba(255,255,255,0.02)" }}>
                          <p className="text-[9px] font-mono text-slate-600 tracking-widest mb-1">{s.label}</p>
                          <p className="text-base font-bold text-white">{s.value}</p>
                        </div>
                      ))}
                    </div>

                    <p className="text-center text-xs font-mono text-slate-700">{d.games} MATCHES ANALYZED</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* ─── ANALYSIS GRID ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Radar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6 }}
            className="border border-cyan-500/15 p-6"
            style={{ background: "rgba(0,5,15,0.8)" }}
          >
            <p className="text-[10px] font-mono text-cyan-400/60 tracking-[0.25em] mb-5">// COMBAT PROFILE MATRIX</p>
            <div className="flex items-center justify-center">
              <ResultRadar values={d.radarValues} size={220} />
            </div>
          </motion.div>

          {/* AI insights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.7 }}
            className="border border-purple-500/15 p-6"
            style={{ background: "rgba(5,0,15,0.8)" }}
          >
            <p className="text-[10px] font-mono text-purple-400/60 tracking-[0.25em] mb-5">// AI BEHAVIORAL ANALYSIS</p>

            {d.insights.length > 0 ? (
              <div className="space-y-3 mb-5">
                {d.insights.map((ins, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.9 + i * 0.1 }}
                    className="flex items-start gap-3">
                    <span className={`text-xs font-mono flex-shrink-0 mt-0.5 ${
                      ins.type === "positive" ? "text-cyan-400" :
                      ins.type === "warning" ? "text-amber-500" : "text-slate-500"}`}>
                      {ins.type === "positive" ? "▲" : ins.type === "warning" ? "▼" : "◈"}
                    </span>
                    <p className="text-sm text-slate-300 leading-relaxed">{ins.text}</p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-slate-600 text-sm mb-5">분석 데이터가 부족합니다.</p>
            )}

            {d.recommendation && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.5 }}
                className="p-3 border border-purple-500/15"
                style={{ background: "rgba(168,85,247,0.06)" }}>
                <p className="text-[10px] font-mono text-purple-400/50 tracking-widest mb-2">// AI RECOMMENDATION</p>
                <p className="text-sm text-slate-200 leading-relaxed italic">"{d.recommendation}"</p>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* ─── SHARE ─── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.6 }}
          className="border border-white/5 p-6 flex flex-col sm:flex-row items-center justify-between gap-5"
          style={{ background: "rgba(255,255,255,0.02)" }}>
          <div>
            <p className="text-white font-bold text-base mb-1">결과를 친구에게 공유해보세요</p>
            <p className="text-slate-500 text-sm">스크린샷 찍어서 디스코드·카카오톡에 공유하면 반응 보장</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button onClick={onReset}
              className="px-5 py-2.5 text-xs font-mono font-bold border border-cyan-500/30 text-cyan-400 tracking-widest uppercase hover:bg-cyan-500/10 transition-all">
              다시 분석하기
            </button>
            <button
              className="px-5 py-2.5 text-xs font-mono font-bold text-black tracking-widest uppercase"
              style={{ background: "linear-gradient(135deg, #00f5ff, #a855f7)", boxShadow: "0 0 20px rgba(0,245,255,0.3)" }}>
              공유하기
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
