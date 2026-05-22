"use client";

import { motion } from "framer-motion";

const STEPS = [
  {
    num: "01",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
        <circle cx="16" cy="16" r="10" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 2" />
        <circle cx="16" cy="16" r="4" fill="currentColor" opacity="0.6" />
        <line x1="16" y1="4" x2="16" y2="8" stroke="currentColor" strokeWidth="1.2" />
        <line x1="16" y1="24" x2="16" y2="28" stroke="currentColor" strokeWidth="1.2" />
        <line x1="4" y1="16" x2="8" y2="16" stroke="currentColor" strokeWidth="1.2" />
        <line x1="24" y1="16" x2="28" y2="16" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
    title: "Search PUBG Player",
    desc: "닉네임을 입력하면 플레이어 전적 스캔이 시작됩니다.",
    accentColor: "text-cyan-400",
    borderColor: "border-cyan-500/25",
    glowColor: "rgba(0,245,255,0.12)",
  },
  {
    num: "02",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
        <polygon points="16,4 28,10 28,22 16,28 4,22 4,10" stroke="currentColor" strokeWidth="1.2" />
        <polygon points="16,10 22,13 22,19 16,22 10,19 10,13" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
        <circle cx="16" cy="16" r="2" fill="currentColor" />
      </svg>
    ),
    title: "Telemetry & Combat Analysis",
    desc: "전투 패턴, 이동 경로, 생존 데이터를 AI가 실시간 분석합니다.",
    accentColor: "text-purple-400",
    borderColor: "border-purple-500/25",
    glowColor: "rgba(168,85,247,0.12)",
  },
  {
    num: "03",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
        <rect x="6" y="8" width="20" height="16" rx="1" stroke="currentColor" strokeWidth="1.2" />
        <line x1="10" y1="13" x2="22" y2="13" stroke="currentColor" strokeWidth="1" opacity="0.5" />
        <line x1="10" y1="17" x2="18" y2="17" stroke="currentColor" strokeWidth="1" opacity="0.5" />
        <line x1="10" y1="21" x2="15" y2="21" stroke="currentColor" strokeWidth="1" opacity="0.5" />
        <circle cx="24" cy="10" r="4" fill="currentColor" opacity="0.8" />
        <path d="M22 10l1.5 1.5L26 8.5" stroke="#050810" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
    title: "AI Persona & Coaching Generated",
    desc: "분석 결과를 바탕으로 플레이어 유형과 맞춤 AI 코칭을 생성합니다.",
    accentColor: "text-cyan-400",
    borderColor: "border-cyan-500/25",
    glowColor: "rgba(0,245,255,0.12)",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-28 px-4 relative overflow-hidden">
      {/* BG accent */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(0,245,255,0.03) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-5xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-cyan-400 text-xs tracking-[0.22em] uppercase mb-3 font-mono">
            // How It Works
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            분석 프로세스
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Connector lines */}
          <div className="hidden md:block absolute top-14 left-[33%] right-[33%] h-px z-0">
            <div className="absolute left-0 right-1/2 h-px" style={{ background: "linear-gradient(90deg, rgba(0,245,255,0.3), rgba(168,85,247,0.3))" }} />
            <div className="absolute left-1/2 right-0 h-px" style={{ background: "linear-gradient(90deg, rgba(168,85,247,0.3), rgba(0,245,255,0.3))" }} />
          </div>

          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.55 }}
              whileHover={{ y: -6 }}
              className="relative z-10"
            >
              <div
                className={`border ${step.borderColor} glass-card p-6 h-full transition-all duration-300 group hover:border-opacity-60`}
                style={{ transition: "box-shadow 0.3s" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 0 30px ${step.glowColor}`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                {/* Step number */}
                <div className="flex items-start justify-between mb-5">
                  <div
                    className={`flex items-center justify-center w-14 h-14 border ${step.borderColor} ${step.accentColor}`}
                    style={{ background: "rgba(0,245,255,0.04)" }}
                  >
                    {step.icon}
                  </div>
                  <span
                    className="text-4xl font-bold font-mono"
                    style={{ color: "rgba(255,255,255,0.06)" }}
                  >
                    {step.num}
                  </span>
                </div>

                <h3 className="text-white font-bold text-base mb-3 leading-snug">
                  {step.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
