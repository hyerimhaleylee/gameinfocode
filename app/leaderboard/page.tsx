"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { LeaderboardEntry } from "@/lib/pubg";

interface SeasonTab { id: string; label: string; isCurrentSeason: boolean; }

// 36시즌부터 PUBG 랭크드 큐 통합 (FPP/TPP 동일 데이터)
const UNIFIED_RANK_SEASON = 36;

// 36시즌 이후 통합 큐: FPP/TPP 구분 없음
const MODES_UNIFIED = [
  { key: "squad-fpp", label: "스쿼드 통합" },
  { key: "duo-fpp",   label: "듀오 통합" },
  { key: "solo-fpp",  label: "솔로 통합" },
];

// 35시즌 이하 분리 큐: FPP/TPP 각각 존재
const MODES_SPLIT = [
  { key: "squad-fpp", label: "스쿼드 1인칭" },
  { key: "squad",     label: "스쿼드 3인칭" },
  { key: "duo-fpp",   label: "듀오 1인칭" },
  { key: "duo",       label: "듀오 3인칭" },
  { key: "solo-fpp",  label: "솔로 1인칭" },
  { key: "solo",      label: "솔로 3인칭" },
];

function getSeasonNum(seasonId: string): number {
  return parseInt(seasonId.match(/pc-2018-(\d+)/)?.[1] ?? "0");
}


const RANK_COLORS: Record<number, { text: string; glow: string }> = {
  1: { text: "#facc15", glow: "rgba(250,204,21,0.4)" },
  2: { text: "#e2e8f0", glow: "rgba(226,232,240,0.3)" },
  3: { text: "#cd7f32", glow: "rgba(205,127,50,0.4)" },
};

function searchPlayer(name: string) {
  window.location.href = `/?q=${encodeURIComponent(name)}`;
}

function RankBadge({ rank }: { rank: number }) {
  const colors = RANK_COLORS[rank];
  if (!colors) {
    return (
      <span className="text-slate-500 font-mono text-sm tabular-nums w-8 inline-block text-right">
        {rank}
      </span>
    );
  }
  return (
    <span
      className="font-mono font-bold text-sm tabular-nums w-8 inline-block text-right"
      style={{ color: colors.text, textShadow: `0 0 10px ${colors.glow}` }}
    >
      {rank}
    </span>
  );
}

export default function LeaderboardPage() {
  const [seasons, setSeasons] = useState<SeasonTab[]>([]);
  const [activeSeason, setActiveSeason] = useState<string>("");
  const [activeMode, setActiveMode] = useState("squad-fpp");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/seasons")
      .then((r) => r.json())
      .then((data: SeasonTab[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setSeasons(data);
          const current = data.find((s) => s.isCurrentSeason) ?? data[0];
          setActiveSeason(current.id);
        }
      })
      .catch(() => {});
  }, []);

  const fetchLeaderboard = useCallback(async (season: string, mode: string) => {
    if (!season) return;
    setLoading(true);
    setError(null);
    setEntries([]);
    try {
      const res = await fetch(`/api/leaderboard?season=${encodeURIComponent(season)}&mode=${encodeURIComponent(mode)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "리더보드 조회 오류");
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "조회 중 오류가 발생했습니다.");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeSeason) fetchLeaderboard(activeSeason, activeMode);
  }, [activeSeason, activeMode, fetchLeaderboard]);

  const isUnifiedSeason = activeSeason ? getSeasonNum(activeSeason) >= UNIFIED_RANK_SEASON : false;
  const activeModes = isUnifiedSeason ? MODES_UNIFIED : MODES_SPLIT;

  const handleModeChange = (mode: string) => {
    if (mode === activeMode || loading) return;
    setActiveMode(mode);
  };

  const handleSeasonChange = (id: string) => {
    if (id === activeSeason || loading) return;
    // TPP 모드(fpp 접미사 없음)에서 통합 시즌으로 이동 시 FPP 버전으로 자동 전환
    if (getSeasonNum(id) >= UNIFIED_RANK_SEASON && !activeMode.endsWith("-fpp")) {
      setActiveMode(activeMode + "-fpp");
    }
    setActiveSeason(id);
  };

  return (
    <main className="bg-[#090f1e] min-h-screen overflow-x-hidden">
      <Navbar />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 40% at 50% 0%, rgba(99,179,237,0.04) 0%, transparent 70%)" }} />

      <div className="max-w-6xl mx-auto px-4 pt-28 pb-20 relative z-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="mb-10">
          <p className="text-cyan-400 text-xs tracking-[0.22em] uppercase mb-2 font-mono">// Leaderboard</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">랭커 TOP 100</h1>
          <p className="text-slate-500 text-sm">시즌별 · 모드별 상위 100명 랭커 데이터 (1시간 캐시)</p>
        </motion.div>

        {/* Season Selector */}
        {seasons.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="mb-4 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono text-slate-600 tracking-widest mr-1">SEASON</span>
            {seasons.map((tab) => (
              <button key={tab.id} onClick={() => handleSeasonChange(tab.id)} disabled={loading}
                className={`px-3 py-1 text-[10px] font-mono tracking-wider border transition-all rounded-sm ${
                  activeSeason === tab.id
                    ? "border-blue-400/60 text-blue-300 bg-blue-500/12"
                    : "border-white/10 text-slate-500 hover:border-slate-400/30 hover:text-slate-300"
                } ${loading ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}>
                {tab.label}
                {tab.isCurrentSeason && <span className="ml-1 text-[8px] text-blue-400/60">NOW</span>}
              </button>
            ))}
          </motion.div>
        )}

        {/* Mode Tabs */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="mb-3 flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono text-slate-600 tracking-widest mr-1">MODE</span>
          {activeModes.map((m) => (
            <button key={m.key} onClick={() => handleModeChange(m.key)} disabled={loading}
              className={`px-3 py-1 text-[10px] font-mono tracking-wider border transition-all rounded-sm ${
                activeMode === m.key
                  ? "border-cyan-400/60 text-cyan-300 bg-cyan-500/10"
                  : "border-white/10 text-slate-500 hover:border-slate-400/30 hover:text-slate-300"
              } ${loading ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}>
              {m.label}
            </button>
          ))}
          {loading && (
            <span className="text-[10px] font-mono text-cyan-400/60 animate-pulse ml-1">LOADING...</span>
          )}
        </motion.div>

        {/* Unified rank notice */}
        <AnimatePresence>
          {isUnifiedSeason && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 px-3 py-2 border border-slate-700/40 rounded-sm flex items-center gap-2"
              style={{ background: "rgba(255,255,255,0.02)" }}>
              <span className="text-slate-500 text-[10px] font-mono">// INFO</span>
              <p className="text-slate-500 text-[10px] font-mono">
                36시즌부터 랭크드 큐가 통합되어 1인칭/3인칭 구분이 없습니다.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 px-4 py-3 border border-red-500/25 rounded-sm"
              style={{ background: "rgba(239,68,68,0.06)" }}>
              <p className="text-red-400 text-xs font-mono">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="border border-white/8 rounded-sm overflow-hidden"
          style={{ background: "rgba(10,15,30,0.9)" }}>
          <div className="px-5 py-3 border-b border-white/6 flex items-center gap-3">
            <span className="text-[10px] font-mono text-slate-500 tracking-[0.2em]">// RANKED TOP 100</span>
            {entries.length > 0 && (
              <span className="text-[9px] font-mono text-slate-700 ml-auto">{entries.length}명</span>
            )}
          </div>

          {loading && entries.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
                  ))}
                </div>
                <p className="text-slate-600 text-xs font-mono tracking-widest">SCANNING...</p>
              </div>
            </div>
          ) : entries.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <p className="text-slate-600 text-sm font-mono">해당 시즌/모드의 리더보드 데이터가 없습니다.</p>
              <p className="text-slate-700 text-[10px] font-mono">PUBG 랭크드는 스쿼드 모드만 지원할 수 있습니다.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/8">
                    {["#", "플레이어", "티어", "RP", "K/D", "평균킬", "평균딜", "승률", "게임수"].map((h) => (
                      <th key={h} className={`py-2.5 px-3 text-left text-slate-600 tracking-wider font-normal ${h === "#" ? "w-12" : ""}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, i) => {
                    const isTop3 = entry.rank <= 3;
                    const colors = RANK_COLORS[entry.rank];
                    return (
                      <motion.tr key={entry.accountId}
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(i * 0.02, 0.5) }}
                        className={`border-b border-white/5 transition-colors ${
                          isTop3 ? "hover:bg-white/4" : "hover:bg-white/2"
                        }`}
                        style={isTop3 && colors ? { background: `${colors.glow.replace("0.4", "0.03")}` } : undefined}>
                        <td className="py-2.5 px-3">
                          <RankBadge rank={entry.rank} />
                        </td>
                        <td className="py-2.5 px-3">
                          <button onClick={() => searchPlayer(entry.name)}
                            className={`font-semibold hover:underline transition-colors text-left ${
                              isTop3 && colors ? "" : "text-slate-200 hover:text-cyan-400"
                            }`}
                            style={isTop3 && colors ? { color: colors.text } : undefined}>
                            {entry.name}
                          </button>
                        </td>
                        <td className="py-2.5 px-3">
                          {entry.tier ? (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-sm border border-amber-500/30 text-amber-300 bg-amber-500/8">
                              {entry.tier} {entry.subTier}
                            </span>
                          ) : <span className="text-slate-700">-</span>}
                        </td>
                        <td className="py-2.5 px-3 text-cyan-300 font-semibold">
                          {entry.rankPoint.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-blue-300">
                          {entry.killDeathRatio.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">
                          {entry.averageKill.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-amber-300">
                          {Math.round(entry.averageDamage)}
                        </td>
                        <td className="py-2.5 px-3 text-emerald-400">
                          {(entry.winRatio * 100).toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {entry.games.toLocaleString()}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-xs font-mono text-slate-400 hover:text-cyan-400 transition-colors tracking-widest uppercase">
            ← 전적 조회로 돌아가기
          </Link>
        </div>
      </div>
      <Footer />
    </main>
  );
}
