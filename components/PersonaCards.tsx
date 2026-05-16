"use client";

import { motion } from "framer-motion";
import MiniRadarChart from "./MiniRadarChart";

const PERSONAS = [
  {
    id: "left_hand",
    title: "왼손 압수",
    subtitle: "LEFT HAND CONFISCATED",
    desc: "공격적인 인파이터. 교전을 두려워하지 않는 전투 특화형 플레이어.",
    comment: "무빙만 보완되면 상위권 진입 가능",
    tier: "GOLD",
    color: "cyan" as const,
    stats: { Combat: 90, Survival: 44, Mobility: 68, Squadplay: 60, Consistency: 54, Adaptability: 73 },
  },
  {
    id: "passenger",
    title: "조수석 마스터",
    subtitle: "PASSENGER MASTER",
    desc: "팀 서포터. 차량 기동과 팀 지원에 특화된 전술 어시스트형.",
    comment: "팀이 있어야 빛나는 숨은 MVP",
    tier: "PLATINUM",
    color: "purple" as const,
    stats: { Combat: 54, Survival: 80, Mobility: 86, Squadplay: 95, Consistency: 70, Adaptability: 65 },
  },
  {
    id: "tower",
    title: "통곡의 포탑",
    subtitle: "TOWER OF DESPAIR",
    desc: "저격·방어 전문. 포지셔닝으로 승부하는 전략적 수비형.",
    comment: "완벽한 포지션, 이동 타이밍 개선 필요",
    tier: "DIAMOND",
    color: "blue" as const,
    stats: { Combat: 70, Survival: 88, Mobility: 28, Squadplay: 50, Consistency: 85, Adaptability: 38 },
  },
  {
    id: "infighter",
    title: "인파이터",
    subtitle: "CLOSE QUARTERS SPECIALIST",
    desc: "근접 교전의 달인. 건물 안에서 최강의 전투력을 발휘하는 CQC형.",
    comment: "실내 교전 승률 최상위권, 원거리 보완 필요",
    tier: "MASTER",
    color: "purple" as const,
    stats: { Combat: 96, Survival: 58, Mobility: 65, Squadplay: 54, Consistency: 76, Adaptability: 80 },
  },
];

const TIER_STYLES: Record<string, { border: string; text: string; bg: string; glow: string }> = {
  GOLD: {
    border: "border-yellow-500/35",
    text: "text-yellow-400",
    bg: "bg-yellow-500/8",
    glow: "rgba(234,179,8,0.18)",
  },
  PLATINUM: {
    border: "border-cyan-400/35",
    text: "text-cyan-300",
    bg: "bg-cyan-400/8",
    glow: "rgba(0,245,255,0.18)",
  },
  DIAMOND: {
    border: "border-blue-400/35",
    text: "text-blue-400",
    bg: "bg-blue-400/8",
    glow: "rgba(59,130,246,0.18)",
  },
  MASTER: {
    border: "border-purple-500/35",
    text: "text-purple-400",
    bg: "bg-purple-500/8",
    glow: "rgba(168,85,247,0.22)",
  },
};

const ACCENT: Record<string, string> = {
  cyan: "text-cyan-400",
  purple: "text-purple-400",
  blue: "text-blue-400",
};

export default function PersonaCards() {
  return (
    <section className="py-28 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-cyan-400 text-xs tracking-[0.22em] uppercase mb-3 font-mono">
            // Player Personas
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            당신의 플레이 유형은?
          </h2>
          <p className="text-slate-500 text-sm tracking-wide">
            AI가 도출한 대표 플레이어 성향 유형
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PERSONAS.map((p, i) => {
            const ts = TIER_STYLES[p.tier];
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.55 }}
                whileHover={{ y: -10, scale: 1.025 }}
                className="relative group cursor-pointer"
              >
                {/* Glow on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ boxShadow: `0 0 40px ${ts.glow}`, borderRadius: 0 }}
                />

                <div
                  className={`relative h-full border ${ts.border} glass-card p-5 flex flex-col transition-all duration-300`}
                >
                  {/* Tier badge */}
                  <div className={`self-start inline-flex px-2.5 py-0.5 text-[10px] font-bold tracking-[0.2em] ${ts.text} border ${ts.border} ${ts.bg} mb-4`}>
                    {p.tier}
                  </div>

                  {/* HUD corner top-right */}
                  <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-cyan-500/20" />

                  {/* Radar */}
                  <div className="flex justify-center my-3">
                    <MiniRadarChart stats={p.stats} color={p.color} />
                  </div>

                  {/* Title */}
                  <h3 className="text-white font-bold text-lg leading-tight mb-0.5">
                    {p.title}
                  </h3>
                  <p className="text-xs tracking-[0.15em] text-slate-600 mb-3 font-mono">
                    {p.subtitle}
                  </p>
                  <p className="text-slate-400 text-sm leading-relaxed flex-1">
                    {p.desc}
                  </p>

                  {/* AI comment */}
                  <div className="mt-4 pt-3 border-t border-white/5">
                    <p className="text-xs font-mono text-slate-600 mb-1">// AI Comment</p>
                    <p className={`text-xs italic ${ACCENT[p.color]}`}>
                      "{p.comment}"
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
