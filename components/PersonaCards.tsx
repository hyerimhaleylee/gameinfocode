"use client";

import { motion } from "framer-motion";
import MiniRadarChart from "./MiniRadarChart";

const PERSONAS = [
  {
    id: "perfect",
    title: "완성형 인간",
    subtitle: "PERFECT HUMAN",
    desc: "KD 3.5 이상, 승률 10% 이상, 평균 딜량 350 이상. 이 게임에 뭔가 문제가 있거나 당신이 특별한 것이다.",
    comment: "이 사람 핵 아니에요?",
    color: "blue" as const,
    stats: { Combat: 95, Survival: 90, Mobility: 80, Squadplay: 75, Consistency: 92, Adaptability: 88 },
  },
  {
    id: "aim_god",
    title: "에임만 신, 뇌는 장식",
    subtitle: "AIM GOD, BRAIN OPTIONAL",
    desc: "KD 2.0 이상, 딜량 220 이상이지만 어시스트가 게임당 0.8 미만. 에임은 타고났지만 팀플은 개발 중.",
    comment: "총은 신이 주셨는데 판단은 안 주셨다",
    color: "cyan" as const,
    stats: { Combat: 90, Survival: 35, Mobility: 60, Squadplay: 30, Consistency: 65, Adaptability: 50 },
  },
  {
    id: "sniper",
    title: "저격의 신",
    subtitle: "GOD OF SNIPING",
    desc: "헤드샷 비율 30% 이상, KD 1.8 이상. 스코프 안에 들어오면 이미 게임 오버.",
    comment: "보이면 죽는다",
    color: "blue" as const,
    stats: { Combat: 85, Survival: 78, Mobility: 35, Squadplay: 45, Consistency: 82, Adaptability: 42 },
  },
  {
    id: "savior",
    title: "팀의 구원자",
    subtitle: "TEAM SAVIOR",
    desc: "KD 1.2 미만이지만 게임당 부활 0.25회, 어시스트 0.4회 이상. 팀원이 쓰러지면 반드시 일으킨다.",
    comment: "팀원이 쓰러지면 내 심장도 쓰러진다",
    color: "purple" as const,
    stats: { Combat: 50, Survival: 75, Mobility: 70, Squadplay: 96, Consistency: 72, Adaptability: 68 },
  },
  {
    id: "zone_master",
    title: "자기장 마스터",
    subtitle: "ZONE MASTER",
    desc: "승률 8% 이상, 평균 생존 22분 이상. 자기장과 함께 춤을 추는 생존의 달인.",
    comment: "자기장이 나를 위해 움직인다",
    color: "cyan" as const,
    stats: { Combat: 62, Survival: 95, Mobility: 78, Squadplay: 60, Consistency: 85, Adaptability: 72 },
  },
  {
    id: "assault",
    title: "돌격대장",
    subtitle: "ASSAULT COMMANDER",
    desc: "KD 1.4 이상, 평균 딜량 200 이상, 근거리 교전 선호. 처음 접선에서 결판을 낸다.",
    comment: "들어가서 죽는 게 전략이야",
    color: "cyan" as const,
    stats: { Combat: 88, Survival: 42, Mobility: 72, Squadplay: 58, Consistency: 52, Adaptability: 78 },
  },
  {
    id: "sense",
    title: "센스쟁이",
    subtitle: "SENSE MASTER",
    desc: "KDA 2.0 이상, 어시스트 0.45회 이상, KD 1.7 이상. 팀 전체를 읽는 게임 IQ의 소유자.",
    comment: "팀이 잘 되면 나도 잘 된다",
    color: "cyan" as const,
    stats: { Combat: 70, Survival: 72, Mobility: 68, Squadplay: 92, Consistency: 78, Adaptability: 82 },
  },
  {
    id: "camper",
    title: "존버황제",
    subtitle: "KING OF CAMPING",
    desc: "TOP 10 진입률 38% 이상이지만 KD 1.0 미만, 평딜 150 미만. 싸움보다는 생존이 목표.",
    comment: "싸움? 그게 뭔데 먹는 건가",
    color: "blue" as const,
    stats: { Combat: 22, Survival: 88, Mobility: 55, Squadplay: 38, Consistency: 65, Adaptability: 35 },
  },
  {
    id: "vehicle",
    title: "탈것 장인",
    subtitle: "VEHICLE MASTER",
    desc: "게임당 주행거리 2500m 이상, KD 1.0 이상. 바퀴가 네 개면 그게 곧 무기다.",
    comment: "차가 곧 나다",
    color: "purple" as const,
    stats: { Combat: 65, Survival: 70, Mobility: 95, Squadplay: 62, Consistency: 72, Adaptability: 70 },
  },
  {
    id: "lone",
    title: "나만 살면 돼",
    subtitle: "LONE SURVIVOR",
    desc: "KD 1.4 이상, 승률 2% 이상이지만 부활 빈도가 낮다. 팀원 걱정보다 내 생존이 우선.",
    comment: "팀원? 나도 죽게 생겼는데",
    color: "purple" as const,
    stats: { Combat: 75, Survival: 65, Mobility: 68, Squadplay: 15, Consistency: 62, Adaptability: 60 },
  },
  {
    id: "barefoot",
    title: "맨발의 사나이",
    subtitle: "BAREFOOT WARRIOR",
    desc: "게임당 도보 이동거리 3500m 이상, 주행거리 800m 미만. 두 발로 전장을 누빈다.",
    comment: "차는 약자가 타는 것",
    color: "purple" as const,
    stats: { Combat: 58, Survival: 80, Mobility: 72, Squadplay: 45, Consistency: 68, Adaptability: 55 },
  },
  {
    id: "marathon",
    title: "마라톤선수",
    subtitle: "MARATHON RUNNER",
    desc: "도보 이동거리 4500m 이상, KD 1.0 미만. 싸움은 못 하지만 달리기는 남다르다.",
    comment: "뛰는 게 좋아서 배그 한다",
    color: "blue" as const,
    stats: { Combat: 32, Survival: 82, Mobility: 85, Squadplay: 42, Consistency: 58, Adaptability: 45 },
  },
  {
    id: "grinder",
    title: "성실한 삽질러",
    subtitle: "DEDICATED GRINDER",
    desc: "총 게임 수 100판 이상, KD 1.0 미만. 못해도 끝까지 한다. 그게 이 게임이다.",
    comment: "못해도 안 그만두는 게 실력이다",
    color: "blue" as const,
    stats: { Combat: 45, Survival: 55, Mobility: 48, Squadplay: 50, Consistency: 88, Adaptability: 42 },
  },
  {
    id: "rookie",
    title: "4렙 가방",
    subtitle: "LVL4 BACKPACK",
    desc: "아직 모든 것이 성장 중인 초보 플레이어. 하지만 시작했다는 것만으로도 충분하다.",
    comment: "아직 가방만 레벨4다",
    color: "blue" as const,
    stats: { Combat: 28, Survival: 45, Mobility: 50, Squadplay: 40, Consistency: 35, Adaptability: 38 },
  },
];


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
                  style={{ boxShadow: "0 0 40px rgba(99,179,237,0.15)", borderRadius: 0 }}
                />

                <div className="relative h-full border border-white/8 glass-card p-5 flex flex-col transition-all duration-300">
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
