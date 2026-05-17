"use client";

import { motion } from "framer-motion";
import MiniRadarChart from "./MiniRadarChart";

const PERSONAS = [
  {
    id: "sniper",
    title: "통곡의 포탑",
    subtitle: "TOWER OF DESPAIR",
    desc: "저격·방어 전문. 포지셔닝으로 승부하는 전략적 수비형. 헤드샷 비율 상위 1%.",
    comment: "완벽한 포지션, 이동 타이밍 개선 필요",
    tier: "DIAMOND",
    color: "blue" as const,
    stats: { Combat: 72, Survival: 88, Mobility: 28, Squadplay: 50, Consistency: 85, Adaptability: 40 },
  },
  {
    id: "left_hand",
    title: "왼손 압수",
    subtitle: "LEFT HAND CONFISCATED",
    desc: "공격적인 인파이터. K/D 2.5+ 에 헤드샷까지. 교전을 두려워하지 않는 전투 특화형.",
    comment: "무빙만 보완되면 상위권 진입 가능",
    tier: "GOLD",
    color: "cyan" as const,
    stats: { Combat: 90, Survival: 44, Mobility: 68, Squadplay: 60, Consistency: 54, Adaptability: 73 },
  },
  {
    id: "chicken_hunter",
    title: "치킨 사냥꾼",
    subtitle: "CHICKEN HUNTER",
    desc: "살아남는 것이 전략. 승률 10% 이상을 유지하는 후반 결정형 생존 전문가.",
    comment: "자기장 끝판왕, 교전 참여를 늘리면 완성형",
    tier: "PLATINUM",
    color: "purple" as const,
    stats: { Combat: 55, Survival: 92, Mobility: 75, Squadplay: 65, Consistency: 80, Adaptability: 70 },
  },
  {
    id: "infighter",
    title: "인파이터",
    subtitle: "CLOSE QUARTERS SPECIALIST",
    desc: "근접 교전의 달인. K/D 1.5+ 평균 딜량 250+ 건물 안에서 최강의 전투력.",
    comment: "실내 교전 승률 최상위권, 원거리 보완 필요",
    tier: "GOLD",
    color: "purple" as const,
    stats: { Combat: 96, Survival: 58, Mobility: 65, Squadplay: 54, Consistency: 76, Adaptability: 80 },
  },
  {
    id: "supporter",
    title: "조수석 마스터",
    subtitle: "PASSENGER MASTER",
    desc: "경기당 어시스트 1.8개 이상. 팀 서포터. 차량 기동과 팀 지원에 특화된 전술 어시스트형.",
    comment: "팀이 있어야 빛나는 숨은 MVP",
    tier: "SILVER",
    color: "cyan" as const,
    stats: { Combat: 54, Survival: 80, Mobility: 86, Squadplay: 95, Consistency: 70, Adaptability: 65 },
  },
  {
    id: "grinder",
    title: "각자도생의 달인",
    subtitle: "LONE WOLF",
    desc: "K/D 1.0+ 판수 50게임 이상. 꾸준함으로 버티는 독립 운영형. 살아있으면 기회는 온다.",
    comment: "꾸준한 게임이 실력의 증거",
    tier: "SILVER",
    color: "blue" as const,
    stats: { Combat: 62, Survival: 65, Mobility: 60, Squadplay: 45, Consistency: 78, Adaptability: 62 },
  },
  {
    id: "rookie",
    title: "4렙 가방",
    subtitle: "LVL4 BACKPACK",
    desc: "아직 가방만 레벨4다. 하지만 시작했다. 성장 가능성을 품은 개발 중인 전사.",
    comment: "시작이 반, 데이터가 쌓이면 달라진다",
    tier: "BRONZE",
    color: "cyan" as const,
    stats: { Combat: 28, Survival: 45, Mobility: 50, Squadplay: 40, Consistency: 35, Adaptability: 38 },
  },
];

const TIER_STYLES: Record<string, { border: string; text: string; bg: string; glow: string }> = {
  DIAMOND: {
    border: "border-blue-400/35",
    text: "text-blue-400",
    bg: "bg-blue-400/8",
    glow: "rgba(59,130,246,0.18)",
  },
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
  SILVER: {
    border: "border-slate-400/35",
    text: "text-slate-300",
    bg: "bg-slate-400/8",
    glow: "rgba(148,163,184,0.15)",
  },
  BRONZE: {
    border: "border-orange-600/35",
    text: "text-orange-400",
    bg: "bg-orange-600/8",
    glow: "rgba(180,100,30,0.15)",
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
