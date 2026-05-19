"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { WeaponStats, WeaponKillEntry } from "@/lib/pubg";

interface WeaponApiResponse {
  telemetry: WeaponStats | null;
  mastery: WeaponStats | null;
  error?: string;
}

const CATEGORY_META: Record<string, { label: string; color: string; bg: string }> = {
  AR:       { label: "돌격소총 (AR)",  color: "#22d3ee", bg: "rgba(34,211,238,0.12)" },
  SMG:      { label: "기관단총 (SMG)", color: "#a855f7", bg: "rgba(168,85,247,0.12)" },
  SG:       { label: "샷건 (SG)",      color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  DMR:      { label: "지정사수 (DMR)", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  SR:       { label: "저격총 (SR)",    color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  Throwable:{ label: "투척류",         color: "#f97316", bg: "rgba(249,115,22,0.12)" },
  기타:     { label: "기타",           color: "#64748b", bg: "rgba(100,116,139,0.08)" },
};

const CATEGORY_ORDER = ["AR", "SMG", "SG", "DMR", "SR", "Throwable", "기타"];

function CategoryBar({ category, kills, total }: { category: string; kills: number; total: number }) {
  const meta = CATEGORY_META[category] ?? CATEGORY_META["기타"];
  const pct = total > 0 ? (kills / total) * 100 : 0;
  if (kills === 0) return null;
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 text-[10px] font-mono text-slate-400 shrink-0">{meta.label}</div>
      <div className="flex-1 h-5 rounded-sm overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="h-full rounded-sm"
          style={{ background: `linear-gradient(90deg, ${meta.color}cc, ${meta.color})` }}
        />
      </div>
      <div className="w-16 text-right font-mono text-xs shrink-0">
        <span style={{ color: meta.color }}>{kills.toLocaleString()}</span>
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
      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.04 * index }}
      className="flex items-center gap-3 py-1.5"
    >
      <div className="w-5 text-[9px] font-mono text-slate-600 text-right shrink-0">{index + 1}</div>
      <div className="w-24 text-xs font-mono text-slate-200 shrink-0 truncate">{entry.displayName}</div>
      <div className="text-[8px] font-mono px-1.5 py-0.5 rounded-sm border shrink-0"
        style={{ color: meta.color, borderColor: `${meta.color}40`, background: meta.bg }}>
        {entry.category}
      </div>
      <div className="flex-1 h-3 rounded-sm overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, delay: 0.04 * index, ease: "easeOut" }}
          className="h-full rounded-sm"
          style={{ background: `${meta.color}99` }}
        />
      </div>
      <div className="w-14 text-right font-mono text-xs text-slate-300 shrink-0">
        {entry.kills.toLocaleString()}킬
      </div>
    </motion.div>
  );
}

function DataView({ data, source }: { data: WeaponStats; source: "telemetry" | "mastery" }) {
  const total = data.totalTracked;
  const maxKills = data.topWeapons[0]?.kills ?? 1;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2">
        <p className="text-slate-600 text-sm font-mono">추적된 킬 데이터 없음</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Disclaimer */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-sm border border-white/6"
        style={{ background: "rgba(255,255,255,0.02)" }}>
        <span className="text-cyan-400/60 text-[10px] font-mono">// DATA</span>
        {source === "telemetry" ? (
          <span className="text-slate-600 text-[10px] font-mono">
            {data.matchesAnalyzed}판 분석
            {(data.cachedMatchCount ?? 0) > 0 && ` (누적 ${data.cachedMatchCount}판 포함)`}
            {" "}· 총 {total.toLocaleString()}킬
          </span>
        ) : (
          <span className="text-slate-600 text-[10px] font-mono">
            Weapon Mastery 전체 기간 집계 · {total.toLocaleString()}킬 추적 · 실제 킬의 일부만 집계됨 (비율 참고용)
          </span>
        )}
      </div>

      {/* Category breakdown */}
      <motion.div key={source + "-cat"} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="border border-white/8 rounded-sm p-5"
        style={{ background: "rgba(10,15,30,0.85)" }}>
        <p className="text-[10px] font-mono text-slate-600 tracking-[0.2em] mb-4">// 카테고리별 킬</p>
        <div className="space-y-2.5">
          {CATEGORY_ORDER.map((cat) => (
            <CategoryBar key={cat} category={cat} kills={data.byCategory[cat] ?? 0} total={total} />
          ))}
        </div>
      </motion.div>

      {/* Top weapons */}
      {data.topWeapons.length > 0 && (
        <motion.div key={source + "-weapons"} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
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

interface Props {
  accountId: string;
  shard: string;
}

type Source = "telemetry" | "mastery";

export default function WeaponTab({ accountId, shard }: Props) {
  const [apiData, setApiData] = useState<WeaponApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<Source>("mastery");

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/weapons?accountId=${encodeURIComponent(accountId)}&shard=${encodeURIComponent(shard)}`)
      .then((r) => r.json())
      .then((d: WeaponApiResponse) => {
        if (d.error) throw new Error(d.error);
        setApiData(d);
        // Default to mastery if available, otherwise telemetry
        setSource(d.mastery && d.mastery.totalTracked > 0 ? "mastery" : "telemetry");
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
        <p className="text-slate-600 text-xs font-mono tracking-widest">무기 데이터 분석 중...</p>
        <p className="text-slate-700 text-[10px] font-mono">텔레메트리 최대 20판 + Weapon Mastery 동시 조회</p>
      </div>
    );
  }

  if (error || !apiData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2">
        <p className="text-red-400 text-xs font-mono">분석 실패</p>
        <p className="text-slate-600 text-[10px] font-mono">{error}</p>
      </div>
    );
  }

  const { telemetry, mastery } = apiData;
  const current = source === "telemetry" ? telemetry : mastery;

  return (
    <div className="space-y-4">
      {/* Source toggle */}
      <div className="flex items-center gap-1 p-1 rounded-sm border border-white/8 w-fit"
        style={{ background: "rgba(255,255,255,0.02)" }}>
        {([
          { key: "mastery" as Source, label: "전체 기간", sub: "Weapon Mastery", available: !!(mastery && mastery.totalTracked > 0) },
          { key: "telemetry" as Source, label: "최근 20판", sub: "텔레메트리", available: !!(telemetry && telemetry.totalTracked > 0) },
        ]).map((opt) => (
          <button key={opt.key}
            onClick={() => opt.available && setSource(opt.key)}
            disabled={!opt.available}
            className={`px-3 py-2 rounded-sm transition-all text-left ${
              source === opt.key
                ? "bg-cyan-500/15 border border-cyan-400/30"
                : opt.available
                  ? "hover:bg-white/4 border border-transparent"
                  : "opacity-30 cursor-not-allowed border border-transparent"
            }`}>
            <p className={`text-[11px] font-mono font-semibold ${source === opt.key ? "text-cyan-300" : "text-slate-400"}`}>
              {opt.label}
            </p>
            <p className="text-[9px] font-mono text-slate-600">{opt.sub}</p>
          </button>
        ))}
      </div>

      {/* How the system works */}
      <div className="px-3 py-3 rounded-sm border border-white/6 space-y-1.5"
        style={{ background: "rgba(255,255,255,0.02)" }}>
        <p className="text-[10px] font-mono text-slate-500 tracking-[0.15em]">// 데이터 수집 방식</p>
        <ul className="space-y-1">
          {[
            "PUBG API는 최신 14판의 매치 ID만 제공합니다. 과거 전체 매치를 직접 가져오는 것은 불가능합니다.",
            "검색할 때마다 최신 14판 ID를 서버에 누적 저장합니다. 반복 검색할수록 분석 가능한 매치 수가 늘어납니다.",
            "한 번 분석된 매치는 캐시에 영구 저장되어 다음 검색 시 즉시 반영됩니다.",
            "최대 200판까지 누적됩니다. 전체 기간 데이터는 상단 'Weapon Mastery' 탭을 활용하세요.",
          ].map((text, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-cyan-400/40 text-[10px] font-mono mt-0.5 shrink-0">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-slate-600 text-[10px] font-mono leading-relaxed">{text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Mastery coverage note */}
      {source === "mastery" && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-sm border border-amber-500/15"
          style={{ background: "rgba(245,158,11,0.04)" }}>
          <span className="text-amber-400/70 text-[10px] mt-0.5">⚠</span>
          <p className="text-amber-300/60 text-[10px] font-mono leading-relaxed">
            Weapon Mastery는 약 2019년 이후 일부 매치만 집계됩니다. 절대 수치보다 무기 선호도 비율 참고용으로 활용하세요.
          </p>
        </div>
      )}

      {current && current.totalTracked > 0 ? (
        <DataView data={current} source={source} />
      ) : (
        <div className="flex flex-col items-center justify-center py-10 gap-2">
          <p className="text-slate-600 text-sm font-mono">이 소스에 데이터 없음</p>
          <p className="text-slate-700 text-[10px] font-mono">다른 소스를 선택해보세요</p>
        </div>
      )}
    </div>
  );
}
