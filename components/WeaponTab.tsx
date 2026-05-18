"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { WeaponStats, WeaponKillEntry } from "@/lib/pubg";

const CATEGORY_META: Record<string, { label: string; color: string; bg: string }> = {
  AR:       { label: "돌격소총 (AR)",   color: "#22d3ee", bg: "rgba(34,211,238,0.12)" },
  SMG:      { label: "기관단총 (SMG)",  color: "#a855f7", bg: "rgba(168,85,247,0.12)" },
  DMR:      { label: "지정사수 (DMR)",  color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  SR:       { label: "저격총 (SR)",     color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  Throwable:{ label: "투척류",          color: "#f97316", bg: "rgba(249,115,22,0.12)" },
  기타:     { label: "기타",            color: "#64748b", bg: "rgba(100,116,139,0.08)" },
};

const CATEGORY_ORDER = ["AR", "SMG", "DMR", "SR", "Throwable", "기타"];

function CategoryBar({ category, kills, total }: { category: string; kills: number; total: number }) {
  const meta = CATEGORY_META[category] ?? CATEGORY_META["기타"];
  const pct = total > 0 ? (kills / total) * 100 : 0;
  if (kills === 0) return null;
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 text-[10px] font-mono text-slate-400 shrink-0">{meta.label}</div>
      <div className="flex-1 h-5 rounded-sm overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="h-full rounded-sm"
          style={{ background: `linear-gradient(90deg, ${meta.color}cc, ${meta.color})` }}
        />
      </div>
      <div className="w-14 text-right font-mono text-xs shrink-0">
        <span style={{ color: meta.color }}>{kills}</span>
        <span className="text-slate-600 ml-1">({pct.toFixed(0)}%)</span>
      </div>
    </div>
  );
}

function WeaponRow({ entry, maxKills, index }: { entry: WeaponKillEntry; maxKills: number; index: number }) {
  const meta = CATEGORY_META[entry.category] ?? CATEGORY_META["기타"];
  const pct = maxKills > 0 ? (entry.kills / maxKills) * 100 : 0;
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 * index }}
      className="flex items-center gap-3 py-1.5"
    >
      <div className="w-5 text-[9px] font-mono text-slate-600 text-right shrink-0">{index + 1}</div>
      <div className="w-24 text-xs font-mono text-slate-200 shrink-0 truncate">{entry.displayName}</div>
      <div
        className="text-[8px] font-mono px-1.5 py-0.5 rounded-sm border shrink-0"
        style={{ color: meta.color, borderColor: `${meta.color}40`, background: meta.bg }}
      >
        {entry.category}
      </div>
      <div className="flex-1 h-3 rounded-sm overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, delay: 0.05 * index, ease: "easeOut" }}
          className="h-full rounded-sm"
          style={{ background: `${meta.color}99` }}
        />
      </div>
      <div className="w-10 text-right font-mono text-xs text-slate-300 shrink-0">{entry.kills}킬</div>
    </motion.div>
  );
}

interface Props {
  accountId: string;
  shard: string;
}

export default function WeaponTab({ accountId, shard }: Props) {
  const [data, setData] = useState<WeaponStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/weapons?accountId=${encodeURIComponent(accountId)}&shard=${encodeURIComponent(shard)}`)
      .then((r) => r.json())
      .then((d: WeaponStats & { error?: string }) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "조회 오류"))
      .finally(() => setLoading(false));
  }, [accountId, shard]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-400"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
          ))}
        </div>
        <p className="text-slate-600 text-xs font-mono tracking-widest">텔레메트리 분석 중...</p>
        <p className="text-slate-700 text-[10px] font-mono">최근 3판 텔레메트리 로드 중 (10~30초 소요)</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2">
        <p className="text-red-400 text-xs font-mono">분석 실패</p>
        <p className="text-slate-600 text-[10px] font-mono">{error}</p>
      </div>
    );
  }

  if (!data || data.totalTracked === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2">
        <p className="text-slate-600 text-sm font-mono">추적된 킬 데이터 없음</p>
        <p className="text-slate-700 text-[10px] font-mono">최근 {data?.matchesAnalyzed ?? 0}판 분석 완료</p>
      </div>
    );
  }

  const total = data.totalTracked;
  const maxKills = data.topWeapons[0]?.kills ?? 1;

  return (
    <div className="space-y-5">
      {/* Disclaimer */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-sm border border-white/6"
        style={{ background: "rgba(255,255,255,0.02)" }}>
        <span className="text-cyan-400/60 text-[10px] font-mono">// DATA</span>
        <span className="text-slate-600 text-[10px] font-mono">
          최근 {data.matchesAnalyzed}판 텔레메트리 기준 · 총 {total}킬 추적
        </span>
      </div>

      {/* Category breakdown */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="border border-white/8 rounded-sm p-5"
        style={{ background: "rgba(10,15,30,0.85)" }}>
        <p className="text-[10px] font-mono text-slate-600 tracking-[0.2em] mb-4">// 카테고리별 킬</p>
        <div className="space-y-2.5">
          {CATEGORY_ORDER.map((cat) => (
            <CategoryBar
              key={cat}
              category={cat}
              kills={data.byCategory[cat] ?? 0}
              total={total}
            />
          ))}
        </div>
      </motion.div>

      {/* Top weapons */}
      {data.topWeapons.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="border border-white/8 rounded-sm p-5"
          style={{ background: "rgba(10,15,30,0.85)" }}>
          <p className="text-[10px] font-mono text-slate-600 tracking-[0.2em] mb-4">// 무기별 킬</p>
          <div className="divide-y divide-white/4">
            {data.topWeapons.map((entry, i) => (
              <WeaponRow key={entry.internalName} entry={entry} maxKills={maxKills} index={i} />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
