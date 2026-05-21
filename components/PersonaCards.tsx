"use client";

import { motion } from "framer-motion";
import MiniRadarChart from "./MiniRadarChart";

const PERSONAS = [
  {
    id: "perfect",
    title: "완성형 인간, 인간의 탈을 쓴 무언가",
    subtitle: "PERFECT HUMAN",
    desc: "KD 3.5 이상, 승률 10% 이상, 평균 딜량 350 이상. 이 게임에 뭔가 문제가 있거나 당신이 특별한 것이다.",
    comment: "이 게임이 잘못된 건지, 당신이 너무 잘하는 건지. 어쨌든 당신 앞에 서면 다들 죽는다.",
    color: "blue" as const,
    stats: { Combat: 95, Survival: 90, Mobility: 80, Squadplay: 75, Consistency: 92, Adaptability: 88 },
  },
  {
    id: "warlord",
    title: "전장의 지배자, 불멸의 수호신",
    subtitle: "LORD OF BATTLEFIELD",
    desc: "총구는 적을 향하고, 손은 동료를 향한다. 살육과 구원을 동시에 행하는 자, 이 전장에서 그는 신과 다름없다.",
    comment: "적은 내가 죽이고, 팀원은 내가 살린다",
    color: "blue" as const,
    stats: { Combat: 92, Survival: 85, Mobility: 75, Squadplay: 88, Consistency: 88, Adaptability: 85 },
  },
  {
    id: "aim_god",
    title: "에임만 신, 뇌는 그냥 장식품",
    subtitle: "AIM GOD, BRAIN OPTIONAL",
    desc: "KD 2.0 이상, 딜량 220 이상이지만 어시스트가 게임당 0.8 미만. 에임은 타고났지만 팀플은 개발 중.",
    comment: "방아쇠만 당기면 된다. 나머지는... 팀원이 알아서 하겠지.",
    color: "cyan" as const,
    stats: { Combat: 90, Survival: 35, Mobility: 60, Squadplay: 30, Consistency: 65, Adaptability: 50 },
  },
  {
    id: "sniper",
    title: "저격의 신, 스코프 너머의 사형선고",
    subtitle: "GOD OF SNIPING",
    desc: "헤드샷 비율 28% 이상, KD 1.5 이상. 스코프 안에 들어오면 이미 게임 오버.",
    comment: "스코프 안에 들어온 순간, 이미 당신은 죽었다.",
    color: "blue" as const,
    stats: { Combat: 85, Survival: 78, Mobility: 35, Squadplay: 45, Consistency: 82, Adaptability: 42 },
  },
  {
    id: "savior",
    title: "팀의 구원자, 쓰러진 자를 일으키는 손",
    subtitle: "TEAM SAVIOR",
    desc: "KD 1.2 미만, 게임당 부활 0.35회 이상, 어시스트 0.4회 이상. 싸움보다 팀원을 살리는 데 집중한다.",
    comment: "내가 살아있는 한, 팀원도 살아있다. 이게 내 전쟁이다.",
    color: "purple" as const,
    stats: { Combat: 50, Survival: 75, Mobility: 70, Squadplay: 96, Consistency: 72, Adaptability: 68 },
  },
  {
    id: "zone_master",
    title: "자기장 마스터, 싸움 없이 이기는 자",
    subtitle: "ZONE MASTER",
    desc: "승률 6% 이상, 평균 생존 13분 이상, KD 1.0 이상. 싸움 없이 끝까지 살아남는 자기장의 달인.",
    comment: "싸움은 안 한다. 자기장이 알아서 죽여주기 때문이다.",
    color: "cyan" as const,
    stats: { Combat: 62, Survival: 95, Mobility: 78, Squadplay: 60, Consistency: 85, Adaptability: 72 },
  },
  {
    id: "assault",
    title: "돌격대장, 생각보다 총구가 먼저",
    subtitle: "ASSAULT COMMANDER",
    desc: "KD 1.0 이상, 평균 딜량 200 이상, 근거리 교전 선호. 생각보다 총이 먼저 나간다.",
    comment: "생각은 나중에. 일단 들어가고 본다. 안 되면 그때 생각한다.",
    color: "cyan" as const,
    stats: { Combat: 88, Survival: 42, Mobility: 72, Squadplay: 58, Consistency: 52, Adaptability: 78 },
  },
  {
    id: "sense",
    title: "센스쟁이, 게임을 읽는 눈을 가진 자",
    subtitle: "SENSE MASTER",
    desc: "KDA 2.0 이상, 어시스트 0.5회 이상, KD 1.7 이상. 팀 전체를 읽는 게임 IQ의 소유자.",
    comment: "나 혼자 잘해봤자 지는 게임. 팀 전체를 이기게 하는 게 진짜 실력이다.",
    color: "cyan" as const,
    stats: { Combat: 70, Survival: 72, Mobility: 68, Squadplay: 92, Consistency: 78, Adaptability: 82 },
  },
  {
    id: "camper",
    title: "존버황제, 총소리 나면 일단 숨는다",
    subtitle: "KING OF CAMPING",
    desc: "TOP 10 진입률 38% 이상이지만 KD 1.0 미만, 평딜 150 미만. 싸움보다는 생존이 목표.",
    comment: "총소리가 나면 숨는다. 자기장이 오면 피한다. 그게 전략의 전부다.",
    color: "blue" as const,
    stats: { Combat: 22, Survival: 88, Mobility: 55, Squadplay: 38, Consistency: 65, Adaptability: 35 },
  },
  {
    id: "vehicle",
    title: "탈것 장인, 바퀴가 곧 무기다",
    subtitle: "VEHICLE MASTER",
    desc: "게임당 주행거리 2000m 이상, KD 0.8 이상. 바퀴가 네 개면 그게 곧 무기다.",
    comment: "두 발로 뛰는 건 시간 낭비다. 네 바퀴면 모든 게 해결된다.",
    color: "purple" as const,
    stats: { Combat: 65, Survival: 70, Mobility: 95, Squadplay: 62, Consistency: 72, Adaptability: 70 },
  },
  {
    id: "lone",
    title: "나만 살면 돼, 팀원은 그냥 구경꾼",
    subtitle: "LONE SURVIVOR",
    desc: "KD 1.4 이상, 승률 2% 이상이지만 부활 빈도가 낮다. 팀원 걱정보다 내 생존이 우선.",
    comment: "팀원이 쓰러졌다. 나는 계속 달린다. 미안하진 않다.",
    color: "purple" as const,
    stats: { Combat: 75, Survival: 65, Mobility: 68, Squadplay: 15, Consistency: 62, Adaptability: 60 },
  },
  {
    id: "barefoot",
    title: "맨발의 사나이, 두 다리로 전장을 누비는 자",
    subtitle: "BAREFOOT WARRIOR",
    desc: "게임당 도보 이동거리 1600m 이상, 주행거리 1200m 미만. 두 발로 전장을 누빈다.",
    comment: "차? 그게 뭔데. 두 다리면 충분하다.",
    color: "purple" as const,
    stats: { Combat: 58, Survival: 80, Mobility: 72, Squadplay: 45, Consistency: 68, Adaptability: 55 },
  },
  {
    id: "marathon",
    title: "마라톤선수, 킬보다 거리가 더 중요한 자",
    subtitle: "MARATHON RUNNER",
    desc: "도보 이동거리 1900m 이상, KD 1.0 미만. 싸움은 못 하지만 달리기는 남다르다.",
    comment: "킬보다 뛰는 게 더 재밌다. 총은 보조 수단일 뿐이다.",
    color: "blue" as const,
    stats: { Combat: 32, Survival: 82, Mobility: 85, Squadplay: 42, Consistency: 58, Adaptability: 45 },
  },
  {
    id: "grinder",
    title: "성실한 삽질러, 오늘도 내일도 지지만 멈추지 않는다",
    subtitle: "DEDICATED GRINDER",
    desc: "총 게임 수 100판 이상, KD 1.0 미만. 못해도 끝까지 한다. 그게 이 게임이다.",
    comment: "100판을 해도 아직 모르겠다. 그래도 내일 또 할 거다.",
    color: "blue" as const,
    stats: { Combat: 45, Survival: 55, Mobility: 48, Squadplay: 50, Consistency: 88, Adaptability: 42 },
  },
  {
    id: "rookie",
    title: "4렙 가방, 아이템은 만렙 전투력은 1렙",
    subtitle: "LVL4 BACKPACK",
    desc: "아직 모든 것이 성장 중인 초보 플레이어. 하지만 시작했다는 것만으로도 충분하다.",
    comment: "아이템은 잘 모은다. 그걸 어떻게 쓰는지가... 아직 연구 중이다.",
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
                  <p className="text-slate-300 text-[0.82rem] leading-relaxed flex-1">
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
