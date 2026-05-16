"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PERSONA = {
  title: "왼손 압수",
  titleEn: "LEFT HAND CONFISCATED",
  quote: "무빙은 희생했지만, 에임은 신이 주었다.",
  tier: "GOLD II",
  kd: "2.34",
  winRate: "8.2%",
  avgDmg: "512",
  headshot: "34%",
  games: "218",
  type: "AGGRESSIVE RIFLER",
  radarValues: [90, 44, 68, 60, 54, 73],
  insights: [
    { t: "pos", text: "초반 교전 진입 성향이 매우 강합니다. 교전 선제 빈도 상위 3%." },
    { t: "pos", text: "헤드샷 정확도가 우수합니다. 평균 34%로 상위 8% 수준." },
    { t: "pos", text: "근거리·중거리 교전 승률이 매우 높습니다." },
    { t: "warn", text: "생존 안정성이 낮아 후반 운영 손실이 반복됩니다." },
    { t: "warn", text: "자기장 내 교전 선택 판단이 불안정합니다." },
  ],
  recommendation:
    "무빙 안정성만 보완되면 상위 티어 진입 가능성이 높습니다. 교전 후 즉각적인 포지션 재설정 훈련을 권장합니다.",
};

const AXES = ["Combat", "Survival", "Mobility", "Squadplay", "Consistency", "Adaptability"];

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
        <filter id="res-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="res-dot" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <linearGradient id="res-fill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(0,245,255,0.22)" />
          <stop offset="100%" stopColor="rgba(168,85,247,0.22)" />
        </linearGradient>
      </defs>
      {levels.map((lv, li) => (
        <polygon key={li} points={grid(lv)} fill="none"
          stroke={`rgba(0,245,255,${0.04 + li * 0.05})`}
          strokeWidth={lv === 1 ? 1 : 0.5}
        />
      ))}
      {AXES.map((_, i) => {
        const e = pt(angle(i), 100);
        return <line key={i} x1={cx} y1={cy} x2={e.x} y2={e.y} stroke="rgba(0,245,255,0.07)" strokeWidth="0.8" />;
      })}
      <motion.polygon
        points={data}
        fill="url(#res-fill)"
        stroke="url(#res-stroke)"
        strokeWidth="2"
        filter="url(#res-glow)"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.8, ease: "easeOut" }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />
      <defs>
        <linearGradient id="res-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00f5ff" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      {values.map((v, i) => {
        const p = pt(angle(i), v);
        return (
          <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 + i * 0.07 }}>
            <circle cx={p.x} cy={p.y} r={5} fill="rgba(0,245,255,0.08)" />
            <circle cx={p.x} cy={p.y} r={2.5} fill="#00f5ff" filter="url(#res-dot)" />
          </motion.g>
        );
      })}
      {AXES.map((axis, i) => {
        const ang = angle(i);
        const lx = cx + r * 1.28 * Math.cos(ang);
        const ly = cy + r * 1.28 * Math.sin(ang);
        const anchor = Math.cos(ang) < -0.1 ? "end" : Math.cos(ang) > 0.1 ? "start" : "middle";
        return (
          <motion.text key={axis} x={lx} y={ly} textAnchor={anchor} dominantBaseline="middle"
            fill="rgba(148,163,184,0.7)" fontSize="10" fontFamily="monospace" letterSpacing="1.5"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 + i * 0.06 }}
          >
            {axis.toUpperCase()}
          </motion.text>
        );
      })}
    </svg>
  );
}

interface Props {
  playerName: string;
  onReset: () => void;
}

export default function ResultSection({ playerName, onReset }: Props) {
  const [scanDone, setScanDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setScanDone(true), 1600);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="min-h-screen px-4 py-20 relative overflow-hidden">
      <div className="absolute inset-0 tactical-grid opacity-20" />
      <div className="scan-lines" />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          onClick={onReset}
          className="flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-cyan-400 transition-colors mb-10 tracking-widest uppercase"
        >
          ← Analyze Another Player
        </motion.button>

        {/* ─── PERSONA CARD ─── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.5, 1, 0.8, 1] }}
          transition={{ duration: 0.45, times: [0, 0.15, 0.3, 0.5, 0.75, 1] }}
          className="relative mb-8 overflow-hidden"
        >
          {/* Scan line sweep */}
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

          {/* Card content — clip-reveals top→bottom */}
          <motion.div
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              className="border border-cyan-500/20 relative"
              style={{
                background: "linear-gradient(135deg, rgba(0,10,20,0.97) 0%, rgba(5,5,25,0.95) 100%)",
                boxShadow: "0 0 60px rgba(0,245,255,0.07), inset 0 0 80px rgba(0,0,0,0.5)",
              }}
            >
              {/* HUD corners */}
              {["top-3 left-3 border-l border-t", "top-3 right-3 border-r border-t", "bottom-3 left-3 border-l border-b", "bottom-3 right-3 border-r border-b"].map((cls, i) => (
                <div key={i} className={`absolute w-5 h-5 ${cls} border-cyan-500/40`} />
              ))}

              {/* Top header bar */}
              <div
                className="flex items-center justify-between px-6 py-3 border-b border-cyan-500/10"
                style={{ background: "rgba(0,245,255,0.03)" }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-cyan-400/60 tracking-[0.25em] uppercase">
                    GAMECODE ANALYSIS REPORT
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <motion.span
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                  />
                  <span className="text-[10px] font-mono text-slate-600 tracking-widest">REPORT GENERATED</span>
                </div>
              </div>

              <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Left: Identity */}
                  <div className="flex-1">
                    <p className="text-[10px] font-mono text-slate-600 tracking-[0.25em] mb-1">TARGET IDENTIFIED</p>
                    <h2 className="text-4xl font-bold text-white tracking-wider mb-6">
                      {playerName.toUpperCase() || "UNKNOWN_PLAYER"}
                    </h2>

                    {/* Divider */}
                    <div className="h-px mb-5" style={{ background: "linear-gradient(90deg, rgba(0,245,255,0.2), transparent)" }} />

                    <p className="text-[10px] font-mono text-slate-600 tracking-[0.25em] mb-2">PRIMARY PERSONA</p>
                    <h3
                      className="text-3xl md:text-4xl font-bold mb-1 leading-tight"
                      style={{
                        color: "#00f5ff",
                        textShadow: "0 0 20px rgba(0,245,255,0.5), 0 0 40px rgba(0,245,255,0.2)",
                      }}
                    >
                      {PERSONA.title}
                    </h3>
                    <p className="text-xs font-mono text-cyan-400/50 tracking-[0.2em] mb-5">{PERSONA.titleEn}</p>

                    {/* Quote */}
                    <div className="relative pl-4 mb-6">
                      <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ background: "linear-gradient(180deg, #00f5ff, #a855f7)" }} />
                      <p className="text-slate-300 text-sm italic leading-relaxed">"{PERSONA.quote}"</p>
                    </div>

                    {/* Type badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-purple-500/30 text-purple-400"
                      style={{ background: "rgba(168,85,247,0.08)" }}>
                      <span className="w-1 h-1 rounded-full bg-purple-400" />
                      <span className="text-xs font-mono font-bold tracking-widest">{PERSONA.type}</span>
                    </div>
                  </div>

                  {/* Right: Stats */}
                  <div className="md:w-56 flex flex-col justify-between gap-4">
                    {/* Tier */}
                    <div className="text-center p-4 border border-yellow-500/25"
                      style={{ background: "rgba(234,179,8,0.05)" }}>
                      <p className="text-[10px] font-mono text-slate-600 tracking-widest mb-1">TIER RANKING</p>
                      <p className="text-2xl font-bold text-yellow-400"
                        style={{ textShadow: "0 0 16px rgba(234,179,8,0.5)" }}>
                        {PERSONA.tier}
                      </p>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "K/D RATIO", value: PERSONA.kd },
                        { label: "WIN RATE", value: PERSONA.winRate },
                        { label: "AVG DAMAGE", value: PERSONA.avgDmg },
                        { label: "HEADSHOT%", value: PERSONA.headshot },
                      ].map((s) => (
                        <div key={s.label} className="p-2.5 border border-white/5 text-center"
                          style={{ background: "rgba(255,255,255,0.02)" }}>
                          <p className="text-[9px] font-mono text-slate-600 tracking-widest mb-1">{s.label}</p>
                          <p className="text-base font-bold text-white">{s.value}</p>
                        </div>
                      ))}
                    </div>

                    <p className="text-center text-xs font-mono text-slate-700">{PERSONA.games} MATCHES ANALYZED</p>
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
            <p className="text-[10px] font-mono text-cyan-400/60 tracking-[0.25em] mb-5">
              // COMBAT PROFILE MATRIX
            </p>
            <div className="flex items-center justify-center">
              <ResultRadar values={PERSONA.radarValues} size={220} />
            </div>
          </motion.div>

          {/* AI Insights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.7 }}
            className="border border-purple-500/15 p-6"
            style={{ background: "rgba(5,0,15,0.8)" }}
          >
            <p className="text-[10px] font-mono text-purple-400/60 tracking-[0.25em] mb-5">
              // AI BEHAVIORAL ANALYSIS
            </p>

            <div className="space-y-3 mb-5">
              {PERSONA.insights.map((ins, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.9 + i * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <span className={`text-xs font-mono flex-shrink-0 mt-0.5 ${ins.t === "pos" ? "text-cyan-400" : "text-amber-500"}`}>
                    {ins.t === "pos" ? "▲" : "▼"}
                  </span>
                  <p className="text-sm text-slate-300 leading-relaxed">{ins.text}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.5 }}
              className="p-3 border border-purple-500/15"
              style={{ background: "rgba(168,85,247,0.06)" }}
            >
              <p className="text-[10px] font-mono text-purple-400/50 tracking-widest mb-2">// AI RECOMMENDATION</p>
              <p className="text-sm text-slate-200 leading-relaxed italic">"{PERSONA.recommendation}"</p>
            </motion.div>
          </motion.div>
        </div>

        {/* ─── SHARE CTA ─── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.6 }}
          className="border border-white/5 p-6 flex flex-col sm:flex-row items-center justify-between gap-5"
          style={{ background: "rgba(255,255,255,0.02)" }}
        >
          <div>
            <p className="text-white font-bold text-base mb-1">결과를 친구에게 공유해보세요</p>
            <p className="text-slate-500 text-sm">
              스크린샷 찍어서 디스코드·카카오톡에 공유하면 반응 보장
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onReset}
              className="px-5 py-2.5 text-xs font-mono font-bold border border-cyan-500/30 text-cyan-400 tracking-widest uppercase hover:bg-cyan-500/10 transition-all"
            >
              다시 분석하기
            </button>
            <button
              className="px-5 py-2.5 text-xs font-mono font-bold text-black tracking-widest uppercase"
              style={{
                background: "linear-gradient(135deg, #00f5ff, #a855f7)",
                boxShadow: "0 0 20px rgba(0,245,255,0.3)",
              }}
            >
              공유하기
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
