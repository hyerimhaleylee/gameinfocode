"use client";

import { motion } from "framer-motion";

const AXES = ["Combat", "Teamwork", "Survival", "Management", "Aggression", "Physical"];
const VALUES = [85, 60, 72, 55, 78, 68];

interface HexRadarProps {
  values: number[];
  size?: number;
}

function HexRadar({ values, size = 320 }: HexRadarProps) {
  const CX = size / 2;
  const CY = size / 2;
  const R = size * 0.36;
  const LEVELS = [0.2, 0.4, 0.6, 0.8, 1.0];
  const n = AXES.length;

  const angle = (i: number) => (2 * Math.PI * i) / n - Math.PI / 2;
  const pt = (ang: number, val: number) => ({
    x: CX + (val / 100) * R * Math.cos(ang),
    y: CY + (val / 100) * R * Math.sin(ang),
  });

  const gridPoly = (level: number) =>
    AXES.map((_, i) => {
      const p = pt(angle(i), 100 * level);
      return `${p.x},${p.y}`;
    }).join(" ");

  const dataPoly = values
    .map((v, i) => {
      const p = pt(angle(i), v);
      return `${p.x},${p.y}`;
    })
    .join(" ");

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="overflow-visible"
    >
      <defs>
        <filter id="hex-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="dot-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="data-fill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(0,245,255,0.25)" />
          <stop offset="100%" stopColor="rgba(168,85,247,0.25)" />
        </linearGradient>
        <linearGradient id="data-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00f5ff" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>

      {/* Grid rings */}
      {LEVELS.map((level, li) => (
        <polygon
          key={li}
          points={gridPoly(level)}
          fill="none"
          stroke={`rgba(0,245,255,${0.04 + li * 0.05})`}
          strokeWidth={level === 1.0 ? 1 : 0.6}
        />
      ))}

      {/* Axis spokes */}
      {AXES.map((_, i) => {
        const end = pt(angle(i), 100);
        return (
          <line
            key={i}
            x1={CX}
            y1={CY}
            x2={end.x}
            y2={end.y}
            stroke="rgba(0,245,255,0.08)"
            strokeWidth="1"
          />
        );
      })}

      {/* Data polygon */}
      <polygon
        points={dataPoly}
        fill="url(#data-fill)"
        stroke="url(#data-stroke)"
        strokeWidth="2"
        filter="url(#hex-glow)"
        className="radar-pulse"
      />

      {/* Data dots */}
      {values.map((v, i) => {
        const p = pt(angle(i), v);
        return (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={6} fill="rgba(0,245,255,0.1)" />
            <circle
              cx={p.x}
              cy={p.y}
              r={3.5}
              fill="#00f5ff"
              filter="url(#dot-glow)"
            />
          </g>
        );
      })}

      {/* Axis labels */}
      {AXES.map((axis, i) => {
        const ang = angle(i);
        const lr = R * 1.28;
        const lx = CX + lr * Math.cos(ang);
        const ly = CY + lr * Math.sin(ang);
        const isLeft = Math.cos(ang) < -0.1;
        const isRight = Math.cos(ang) > 0.1;
        const anchor = isLeft ? "end" : isRight ? "start" : "middle";
        return (
          <text
            key={axis}
            x={lx}
            y={ly}
            textAnchor={anchor}
            dominantBaseline="middle"
            fill="rgba(148,163,184,0.75)"
            fontSize="11"
            fontFamily="monospace"
            letterSpacing="1.5"
          >
            {axis.toUpperCase()}
          </text>
        );
      })}

      {/* Center dot */}
      <circle cx={CX} cy={CY} r={3} fill="rgba(0,245,255,0.4)" />
    </svg>
  );
}

export default function RadarChartSection() {
  return (
    <section className="py-28 px-4 relative overflow-hidden">
      {/* Grid bg */}
      <div className="absolute inset-0 tactical-grid opacity-30 z-0" />
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(168,85,247,0.04) 0%, transparent 70%)",
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
            // Combat Profile Matrix
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            6-Axis Player Analysis
          </h2>
          <p className="text-slate-500 text-sm">
            AI가 6가지 전투 지표로 플레이어 성향을 분석합니다
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Radar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex-shrink-0 relative"
          >
            {/* Outer ring decoration */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                border: "1px solid rgba(0,245,255,0.06)",
                transform: "scale(1.15)",
                boxShadow: "0 0 60px rgba(0,245,255,0.06)",
              }}
            />
            <HexRadar values={VALUES} size={300} />
          </motion.div>

          {/* Stat bars */}
          <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
            {AXES.map((axis, i) => (
              <motion.div
                key={axis}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.5 }}
                className="p-4 border border-white/5 glass-card"
              >
                <div className="flex justify-between items-center mb-2.5">
                  <span className="text-xs font-mono text-slate-400 tracking-widest">
                    {axis.toUpperCase()}
                  </span>
                  <span className="text-xs font-bold text-cyan-400 font-mono">
                    {VALUES[i]}
                  </span>
                </div>
                <div className="h-0.5 bg-white/5 overflow-hidden">
                  <motion.div
                    initial={{ width: "0%" }}
                    whileInView={{ width: `${VALUES[i]}%` }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.07 + 0.3, duration: 0.9, ease: "easeOut" }}
                    className="h-full"
                    style={{
                      background: "linear-gradient(90deg, #00f5ff, #a855f7)",
                      boxShadow: "0 0 8px rgba(0,245,255,0.6)",
                    }}
                  />
                </div>
                {/* Tier label */}
                <p className="text-[10px] text-slate-700 font-mono mt-2">
                  {VALUES[i] >= 80
                    ? "EXCELLENT"
                    : VALUES[i] >= 65
                    ? "ABOVE AVG"
                    : VALUES[i] >= 50
                    ? "AVERAGE"
                    : "NEEDS WORK"}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
