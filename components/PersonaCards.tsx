"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getPersonaArchetypeRadar, getPersonaStaticInfo } from "@/lib/persona";
import MiniRadarChart from "./MiniRadarChart";

const PERSONAS = [
  {
    id: "perfect",
    title: "완성형 인간, 인간의 탈을 쓴 무언가",
    subtitle: "PERFECT HUMAN",
    desc: "어떤 지표를 봐도 설명이 안 되는 수준. 이 게임이 뭔가 잘못된 건지, 아니면 당신이 너무 특별한 건지.",
    comment: "이 게임이 잘못된 건지, 당신이 너무 잘하는 건지. 어쨌든 당신 앞에 서면 다들 죽는다.",
    color: "blue" as const,
  },
  {
    id: "warlord",
    title: "전장의 지배자, 불멸의 수호신",
    subtitle: "LORD OF BATTLEFIELD",
    desc: "총구는 적을 향하고, 손은 동료를 향한다. 교전도 강하고 팀도 살린다. 이 전장에서 가장 위험한 존재.",
    comment: "적은 내가 죽이고, 팀원은 내가 살린다",
    color: "blue" as const,
  },
  {
    id: "sense",
    title: "센스쟁이, 게임을 읽는 눈을 가진 자",
    subtitle: "SENSE MASTER",
    desc: "팀 전체의 흐름을 읽는다. 혼자 잘하는 것보다 팀이 이기는 걸 더 중요하게 생각하는 게임 IQ의 소유자.",
    comment: "나 혼자 잘해봤자 지는 게임. 팀 전체를 이기게 하는 게 진짜 실력이다.",
    color: "cyan" as const,
  },
  {
    id: "aim_god",
    title: "에임만 신, 뇌는 그냥 장식품",
    subtitle: "AIM GOD, BRAIN OPTIONAL",
    desc: "에임은 타고났다. 교전 능력은 최상급이지만 팀원과의 협력은 아직 개발 중인 1인 화력 집중형.",
    comment: "방아쇠만 당기면 된다. 나머지는... 팀원이 알아서 하겠지.",
    color: "cyan" as const,
  },
  {
    id: "hotdrop",
    title: "핫드랍 광신도, 착지하자마자 전쟁이다",
    subtitle: "HOTDROP FANATIC",
    desc: "조용한 게임은 내 게임이 아니다. 어디에 내려도 바로 교전. 빠르게 치고 빠르게 죽는 것도 실력이다.",
    comment: "착지하자마자 총소리. 그게 좋다. 조용한 게임은 내 게임이 아니다.",
    color: "cyan" as const,
  },
  {
    id: "sniper",
    title: "저격의 신, 스코프 너머의 사형선고",
    subtitle: "GOD OF SNIPING",
    desc: "스코프 너머를 보면 이미 결론이 난다. 남들보다 압도적으로 높은 정밀도로 전장을 지배하는 저격 전문가.",
    comment: "스코프 안에 들어온 순간, 이미 당신은 죽었다.",
    color: "blue" as const,
  },
  {
    id: "lone",
    title: "나만 살면 돼, 팀원은 그냥 구경꾼",
    subtitle: "LONE SURVIVOR",
    desc: "교전도 잘 하고 딜도 잘 넣는다. 다만 팀원이 쓰러져도 멈추지 않는다. 동료 살리는 건 관심 밖.",
    comment: "팀원이 쓰러졌다. 나는 계속 달린다. 미안하진 않다.",
    color: "purple" as const,
  },
  {
    id: "assault",
    title: "돌격대장, 생각보다 총구가 먼저",
    subtitle: "ASSAULT COMMANDER",
    desc: "생각은 나중에. 일단 들어가고 본다. 교전 능력은 충분하지만 진입 판단은 항상 총구가 먼저다.",
    comment: "생각은 나중에. 일단 들어가고 본다. 안 되면 그때 생각한다.",
    color: "cyan" as const,
  },
  {
    id: "zone_master",
    title: "자기장 마스터, 싸움 없이 이기는 자",
    subtitle: "ZONE MASTER",
    desc: "싸움 없이도 살아남는다. 자기장을 누구보다 잘 읽고, 최소한의 교전으로 최대한 버티는 생존 전문가.",
    comment: "싸움은 안 한다. 자기장이 알아서 죽여주기 때문이다.",
    color: "cyan" as const,
  },
  {
    id: "vehicle",
    title: "탈것 장인, 바퀴가 곧 무기다",
    subtitle: "VEHICLE MASTER",
    desc: "두 발로 뛰는 건 시간 낭비다. 바퀴 달린 건 전부 무기이자 이동 수단. 전장을 가장 빠르게 누비는 자.",
    comment: "두 발로 뛰는 건 시간 낭비다. 네 바퀴면 모든 게 해결된다.",
    color: "purple" as const,
  },
  {
    id: "lucky_chicken",
    title: "어쩌다 치킨, 어떻게 이긴 건지 나도 모른다",
    subtitle: "ACCIDENTAL CHAMPION",
    desc: "교전은 자신 없지만 어쩌다 보면 마지막까지 살아있다. 전투력보다 운과 생존 본능으로 치킨을 먹는 타입.",
    comment: "총 싸움은 자신 없다. 그냥 숨어있었는데... 다들 죽어있었다.",
    color: "blue" as const,
  },
  {
    id: "savior",
    title: "팀의 구원자, 쓰러진 자를 일으키는 손",
    subtitle: "TEAM SAVIOR",
    desc: "직접 킬은 많지 않지만 팀원이 쓰러지면 가장 먼저 달려간다. 팀의 생존율을 혼자 책임지는 지원군.",
    comment: "내가 살아있는 한, 팀원도 살아있다. 이게 내 전쟁이다.",
    color: "purple" as const,
  },
  {
    id: "twolegs",
    title: "두 발의 용사, 지도를 두 다리로 정복하는 자",
    subtitle: "TWO-LEGGED HERO",
    desc: "차량은 시끄럽고 눈에 띈다. 두 발로 묵묵히 걷는다. 이 게임에서 가장 조용하게 전장을 가로지르는 자.",
    comment: "차는 시끄럽고 눈에 띈다. 걸어서 가면 아무도 모른다.",
    color: "purple" as const,
  },
  {
    id: "camper",
    title: "존버황제, 총소리 나면 일단 숨는다",
    subtitle: "KING OF CAMPING",
    desc: "총소리가 나면 숨는다. 교전보다 생존이 우선. 싸우지 않고도 끝까지 남아있는 것이 이 플레이어의 전략.",
    comment: "총소리가 나면 숨는다. 자기장이 오면 피한다. 그게 전략의 전부다.",
    color: "blue" as const,
  },
  {
    id: "grinder",
    title: "성실한 삽질러, 오늘도 내일도 지지만 멈추지 않는다",
    subtitle: "DEDICATED GRINDER",
    desc: "실력이 빠르게 늘지 않아도 포기하지 않는다. 누구보다 많이 플레이하며 언젠가 올라설 날을 기다리는 타입.",
    comment: "100판을 해도 아직 모르겠다. 그래도 내일 또 할 거다.",
    color: "blue" as const,
  },
  {
    id: "rookie",
    title: "4렙 가방, 아이템은 만렙 전투력은 1렙",
    subtitle: "LVL4 BACKPACK",
    desc: "아직 모든 것이 성장 중인 초보 플레이어. 하지만 시작했다는 것만으로도 충분하다.",
    comment: "아이템은 잘 모은다. 그걸 어떻게 쓰는지가... 아직 연구 중이다.",
    color: "blue" as const,
  },
];

const ACCENT: Record<string, string> = {
  cyan: "text-cyan-400",
  purple: "text-purple-400",
  blue: "text-blue-400",
};

const ACCENT_BG: Record<string, string> = {
  cyan: "bg-cyan-400",
  purple: "bg-purple-400",
  blue: "bg-blue-400",
};

const RADAR_KEYS = ["Combat", "Teamwork", "Survival", "Management", "Aggression", "Physical"];

const AXIS_GUIDE = [
  { key: "Combat",     label: "전투력",  desc: "KD + 딜량. 교전에서 얼마나 강한가" },
  { key: "Teamwork",   label: "팀워크",  desc: "어시스트 + 부활. 팀에 얼마나 기여하는가" },
  { key: "Survival",   label: "생존력",  desc: "승률 + 생존시간. 끝까지 살아남는가" },
  { key: "Management", label: "운영력",  desc: "탑10 진입률 + 이동거리. 자기장을 얼마나 읽는가" },
  { key: "Aggression", label: "공격성",  desc: "시간당 딜량. 얼마나 먼저 싸움에 뛰어드는가" },
  { key: "Physical",   label: "피지컬",  desc: "킬당 딜 효율. 한 발 한 발 얼마나 정확한가" },
];

export default function PersonaCards() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? PERSONAS.find((p) => p.id === selectedId) : null;

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
          <p className="text-sm text-slate-500 font-mono tracking-wide mt-3">
            다른 유형과 비교해보세요 — 총 16개의 전투 페르소나
          </p>
        </motion.div>

        {/* 축 가이드 스트립 */}
        <div className="mb-10 p-4 border border-white/6 bg-white/[0.02]">
          <p className="text-[10px] tracking-[0.2em] text-slate-500 font-mono mb-3 uppercase">// Radar Axes Guide</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {AXIS_GUIDE.map((ax) => (
              <div key={ax.key} className="flex flex-col gap-1">
                <span className="text-xs font-bold text-white">{ax.label}</span>
                <span className="text-[10px] text-slate-500 leading-snug">{ax.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 카드 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {PERSONAS.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.55 }}
              whileHover={{ y: -10, scale: 1.025 }}
              onClick={() => setSelectedId(p.id)}
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
                  <MiniRadarChart
                    stats={Object.fromEntries(
                      RADAR_KEYS.map((k, idx) => [k, getPersonaArchetypeRadar(p.id)[idx]])
                    )}
                    color={p.color}
                  />
                </div>

                {/* Title */}
                <h3 className="text-white font-bold text-lg leading-tight mb-0.5">
                  {p.title}
                </h3>
                <p className="text-xs tracking-[0.15em] text-slate-400 mb-3 font-mono">
                  {p.subtitle}
                </p>
                <p className="text-slate-300 text-[0.82rem] leading-relaxed flex-1">
                  {p.desc}
                </p>

                {/* AI comment */}
                <div className="mt-4 pt-3 border-t border-white/8">
                  <p className="text-xs font-mono text-slate-500 mb-1">// AI Comment</p>
                  <p className={`text-xs italic ${ACCENT[p.color]}`}>
                    "{p.comment}"
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 모달 */}
      <AnimatePresence>
        {selected && (
          <>
            {/* 백드롭 */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedId(null)}
              className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
            />

            {/* 모달 카드 */}
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div
                className="relative w-full max-w-2xl glass-card border border-white/10 p-6 md:p-8 pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* 닫기 버튼 */}
                <button
                  onClick={() => setSelectedId(null)}
                  className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors text-lg"
                >
                  ✕
                </button>

                {/* HUD 코너 장식 */}
                <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-cyan-500/30" />
                <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r border-cyan-500/30" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* 왼쪽: 레이더 + 축 점수바 */}
                  <div className="flex flex-col items-center gap-4">
                    <MiniRadarChart
                      stats={Object.fromEntries(
                        RADAR_KEYS.map((k, idx) => [k, getPersonaArchetypeRadar(selected.id)[idx]])
                      )}
                      color={selected.color}
                    />

                    {/* 6개 축 점수바 */}
                    <div className="w-full space-y-2">
                      {AXIS_GUIDE.map((ax, idx) => {
                        const val = getPersonaArchetypeRadar(selected.id)[idx];
                        return (
                          <div key={ax.key} className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 w-12 shrink-0">{ax.label}</span>
                            <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${val}%` }}
                                transition={{ duration: 0.6, delay: idx * 0.05 }}
                                className={`h-full rounded-full ${ACCENT_BG[selected.color]}`}
                              />
                            </div>
                            <span className="text-[10px] text-slate-500 w-6 text-right">{val}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 오른쪽: 텍스트 정보 */}
                  <div className="flex flex-col gap-3">
                    {/* 배지 */}
                    {(() => {
                      const info = getPersonaStaticInfo(selected.id);
                      return info ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono px-2 py-0.5 border border-white/10 text-slate-400">{info.type}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 border border-white/10 text-slate-400">{info.tier}</span>
                        </div>
                      ) : null;
                    })()}

                    {/* 제목 */}
                    <div>
                      <h3 className="text-white font-bold text-xl leading-tight">{selected.title}</h3>
                      <p className="text-[11px] tracking-[0.15em] text-slate-400 font-mono mt-1">{selected.subtitle}</p>
                    </div>

                    {/* 설명 */}
                    <p className="text-slate-300 text-sm leading-relaxed">{selected.desc}</p>

                    {/* AI 코멘트 */}
                    <div className="pt-2 border-t border-white/6 mt-auto">
                      <p className="text-[10px] text-slate-500 font-mono mb-1">// AI Comment</p>
                      <p className={`text-xs italic ${ACCENT[selected.color]}`}>
                        "{selected.comment}"
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
