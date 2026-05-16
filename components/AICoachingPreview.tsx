"use client";

import { motion } from "framer-motion";

const MOCK = {
  player: "Ottank",
  persona: "LEFT HAND CONFISCATED",
  personaKr: "왼손 압수",
  tier: "GOLD II",
  kd: "2.34",
  winRate: "8.2%",
  avgDmg: "512",
  headshot: "34%",
  games: "218",
  insights: [
    { type: "positive", text: "헤드샷 정확도가 매우 높습니다 — 상위 5% 수준." },
    { type: "positive", text: "교전 선제 빈도 87%. 공격 진입 성향이 매우 강합니다." },
    { type: "warning", text: "생존 안정성이 낮아 후반 운영 손실이 반복됩니다." },
    { type: "warning", text: "자기장 내 교전 선택 판단이 불안정합니다." },
  ],
  recommendation:
    "무빙 안정성만 보완되면 상위 티어 진입 가능성이 높습니다. 교전 후 즉각적인 포지션 재설정 훈련을 권장합니다.",
};

const REPORT_ID = "GC-84712";

export default function AICoachingPreview() {
  return (
    <section className="py-28 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-purple-400 text-xs tracking-[0.22em] uppercase mb-3 font-mono">
            // AI Analysis Preview
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            실제 분석 리포트
          </h2>
          <p className="text-slate-500 text-sm">이런 방식으로 분석 결과가 제공됩니다</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 16 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
          className="border border-cyan-500/15 overflow-hidden"
          style={{
            background: "rgba(3,7,18,0.92)",
            boxShadow: "0 0 60px rgba(0,245,255,0.06), inset 0 0 60px rgba(0,0,0,0.4)",
          }}
        >
          {/* Terminal header */}
          <div
            className="flex items-center justify-between px-5 py-3 border-b border-cyan-500/10"
            style={{ background: "rgba(0,245,255,0.04)" }}
          >
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              </div>
              <span className="text-cyan-400 text-xs font-mono tracking-[0.18em]">
                GAMECODE ANALYSIS SYSTEM v2.6
              </span>
            </div>
            <span className="text-slate-700 text-xs font-mono">REPORT_ID: {REPORT_ID}</span>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            {/* Player header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
              <div>
                <p className="text-xs font-mono text-slate-600 tracking-widest mb-1">// Target Player</p>
                <h3 className="text-3xl font-bold text-white tracking-wide">{MOCK.player}</h3>
              </div>
              <div className="grid grid-cols-3 gap-6">
                {[
                  { label: "K/D", val: MOCK.kd },
                  { label: "WIN%", val: MOCK.winRate },
                  { label: "AVG DMG", val: MOCK.avgDmg },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="text-xs text-slate-600 font-mono tracking-widest">{s.label}</p>
                    <p className="text-xl font-bold text-white mt-1">{s.val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Persona block */}
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="p-4 border border-cyan-500/15"
              style={{ background: "rgba(0,245,255,0.04)" }}
            >
              <p className="text-xs font-mono text-cyan-400/60 tracking-widest mb-2">// Player Type</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-white">{MOCK.personaKr}</p>
                  <p className="text-xs text-cyan-400 font-mono tracking-widest mt-0.5">{MOCK.persona}</p>
                </div>
                <div className="text-right">
                  <div
                    className="inline-flex px-3 py-1 text-xs font-bold text-yellow-400 border border-yellow-500/35 tracking-widest"
                    style={{ background: "rgba(234,179,8,0.08)" }}
                  >
                    {MOCK.tier}
                  </div>
                  <p className="text-xs text-slate-600 font-mono mt-1.5">{MOCK.games} GAMES</p>
                </div>
              </div>
            </motion.div>

            {/* Insights */}
            <div>
              <p className="text-xs font-mono text-slate-600 tracking-widest mb-4">// AI Summary</p>
              <div className="space-y-3">
                {MOCK.insights.map((ins, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                    className="flex items-start gap-3"
                  >
                    <span
                      className={`mt-0.5 text-xs flex-shrink-0 font-mono ${
                        ins.type === "positive" ? "text-cyan-400" : "text-amber-500"
                      }`}
                    >
                      {ins.type === "positive" ? "▲" : "▼"}
                    </span>
                    <p className="text-sm text-slate-300">{ins.text}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Recommendation */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.35 }}
              className="p-4 border border-purple-500/15"
              style={{ background: "rgba(168,85,247,0.05)" }}
            >
              <p className="text-xs font-mono text-purple-400/60 tracking-widest mb-3">// AI Recommendation</p>
              <p className="text-slate-200 text-sm leading-relaxed">
                "{MOCK.recommendation}"
              </p>
            </motion.div>

            {/* Bottom CTA */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between">
              <p className="text-xs text-slate-700 font-mono">
                Generated by GAMECODE AI Engine
              </p>
              <button
                className="px-5 py-2 text-xs font-bold text-black tracking-widest uppercase"
                style={{
                  background: "linear-gradient(135deg, #00f5ff, #00c4d4)",
                  boxShadow: "0 0 16px rgba(0,245,255,0.35)",
                }}
              >
                Analyze My Account
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
