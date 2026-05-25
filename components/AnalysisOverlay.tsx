"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = [
  "INITIALIZING TELEMETRY SYSTEM",
  "RETRIEVING COMBAT RECORDS",
  "ANALYZING COMBAT PATTERNS",
  "DETECTING SQUAD BEHAVIOR",
  "MAPPING MOVEMENT SIGNATURES",
  "GENERATING PLAYER PERSONA",
];

const BLIPS = [
  { r: 0.38, a: 52 },
  { r: 0.71, a: 138 },
  { r: 0.54, a: 225 },
  { r: 0.82, a: 307 },
  { r: 0.29, a: 175 },
  { r: 0.66, a: 18 },
];

function OverlayRadar({ size = 260 }: { size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
      <defs>
        <filter id="ov-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="ov-dot-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Rings */}
      {[0.3, 0.55, 0.8, 1.0].map((s, i) => (
        <circle
          key={i}
          cx={cx} cy={cy} r={r * s}
          fill="none"
          stroke={`rgba(0,245,255,${0.07 + i * 0.05})`}
          strokeWidth={s === 1.0 ? 1 : 0.6}
          strokeDasharray={s < 1 ? "4 8" : undefined}
        />
      ))}

      {/* Crosshairs */}
      <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="rgba(0,245,255,0.06)" strokeWidth="0.6" />
      <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke="rgba(0,245,255,0.06)" strokeWidth="0.6" />
      {[45, 135].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <line
            key={deg}
            x1={cx - r * Math.cos(rad)} y1={cy - r * Math.sin(rad)}
            x2={cx + r * Math.cos(rad)} y2={cy + r * Math.sin(rad)}
            stroke="rgba(0,245,255,0.04)" strokeWidth="0.5"
          />
        );
      })}

      {/* Rotating sweep */}
      <motion.g
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        style={{ transformBox: "fill-box" as never, transformOrigin: "center" }}
      >
        {/* Invisible circle: makes fill-box symmetric around (cx,cy) so "center" = radar center */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="none" />
        {Array.from({ length: 18 }, (_, i) => {
          const angle = -(i + 1) * 5.5;
          const rad = (angle * Math.PI) / 180;
          const opacity = Math.max(0, 0.45 - i * 0.025);
          return (
            <line key={i}
              x1={cx} y1={cy}
              x2={cx + r * Math.cos(rad)}
              y2={cy + r * Math.sin(rad)}
              stroke={`rgba(0,245,255,${opacity})`}
              strokeWidth="1"
            />
          );
        })}
        <line
          x1={cx} y1={cy} x2={cx + r} y2={cy}
          stroke="rgba(0,245,255,0.95)"
          strokeWidth="1.5"
          filter="url(#ov-glow)"
        />
      </motion.g>

      {/* Blips */}
      {BLIPS.map((b, i) => {
        const rad = (b.a * Math.PI) / 180;
        const bx = cx + r * b.r * Math.cos(rad);
        const by = cy + r * b.r * Math.sin(rad);
        return (
          <motion.g key={i}>
            <motion.circle
              cx={bx} cy={by} r={5}
              fill="rgba(0,245,255,0.06)"
              animate={{ r: [4, 8, 4], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 2 + i * 0.4, repeat: Infinity, delay: i * 0.3 }}
            />
            <circle cx={bx} cy={by} r={2.5} fill="rgba(0,245,255,0.85)" filter="url(#ov-dot-glow)" />
          </motion.g>
        );
      })}

      {/* Center */}
      <circle cx={cx} cy={cy} r={4} fill="rgba(0,245,255,0.15)" />
      <circle cx={cx} cy={cy} r={2} fill="#00f5ff" filter="url(#ov-glow)" />
    </svg>
  );
}

interface Props {
  playerName: string;
  ready: boolean;
  onComplete: () => void;
}

export default function AnalysisOverlay({ playerName, ready, onComplete }: Props) {
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [complete, setComplete] = useState(false);
  const [exiting, setExiting] = useState(false);

  const done = useCallback(onComplete, [onComplete]);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const interval = 680;

    STEPS.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleSteps(i + 1), (i + 1) * interval));
    });

    timers.push(setTimeout(() => setComplete(true), (STEPS.length + 1) * interval));

    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (!complete || !ready) return;
    const t1 = setTimeout(() => setExiting(true), 800);
    const t2 = setTimeout(() => done(), 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [complete, ready, done]);

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: "#030609" }}
        >
          {/* Tactical grid bg */}
          <div className="absolute inset-0 tactical-grid opacity-30" />
          <div className="scan-lines" />

          {/* Corner decorations */}
          {[
            "top-6 left-6 border-l-2 border-t-2",
            "top-6 right-6 border-r-2 border-t-2",
            "bottom-6 left-6 border-l-2 border-b-2",
            "bottom-6 right-6 border-r-2 border-b-2",
          ].map((cls, i) => (
            <div key={i} className={`absolute w-10 h-10 ${cls} border-cyan-500/30`} />
          ))}

          {/* Top label */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="absolute top-8 left-1/2 -translate-x-1/2 text-xs font-mono text-cyan-400/60 tracking-[0.3em] uppercase"
          >
            GAMECODE TACTICAL ANALYSIS
          </motion.div>

          <div className="relative z-10 flex flex-col items-center gap-10 px-4">
            {/* Radar */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="relative"
            >
              <OverlayRadar size={240} />
              {/* Player name below radar */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-center">
                <p className="text-xs font-mono text-cyan-400/50 tracking-widest">TARGET</p>
                <p className="text-sm font-bold font-mono text-white tracking-widest mt-0.5">
                  {playerName.toUpperCase()}
                </p>
              </div>
            </motion.div>

            {/* Log panel */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="w-full max-w-sm mt-4"
              style={{
                background: "rgba(0,10,20,0.8)",
                border: "1px solid rgba(0,245,255,0.12)",
                backdropFilter: "blur(8px)",
              }}
            >
              <div
                className="flex items-center gap-2 px-4 py-2 border-b border-cyan-500/10"
                style={{ background: "rgba(0,245,255,0.04)" }}
              >
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                />
                <span className="text-xs font-mono text-cyan-400/70 tracking-widest">ANALYSIS LOG</span>
              </div>

              <div className="px-4 py-4 space-y-2 min-h-[180px]">
                {STEPS.map((step, i) => (
                  <AnimatePresence key={step}>
                    {i < visibleSteps && (
                      <motion.div
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center gap-3"
                      >
                        <span className="text-cyan-400 text-xs font-mono">✓</span>
                        <span className="text-xs font-mono text-slate-400 tracking-wider">{step}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                ))}

                {/* Active step */}
                {!complete && visibleSteps < STEPS.length && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3"
                  >
                    <motion.span
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity }}
                      className="text-cyan-400 text-xs font-mono"
                    >
                      ▸
                    </motion.span>
                    <span className="text-xs font-mono text-cyan-300 tracking-wider">
                      {STEPS[visibleSteps]}
                      <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                        className="ml-0.5"
                      >_</motion.span>
                    </span>
                  </motion.div>
                )}

                {/* Complete */}
                <AnimatePresence>
                  {complete && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 pt-3 border-t border-cyan-500/15 flex items-center gap-3"
                    >
                      <span className="text-cyan-400 text-xs">◈</span>
                      <span
                        className="text-xs font-mono font-bold tracking-widest"
                        style={{ color: "#00f5ff", textShadow: "0 0 10px rgba(0,245,255,0.8)" }}
                      >
                        ANALYSIS COMPLETE — PROFILE GENERATED
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Progress bar */}
              <div className="h-px bg-white/5">
                <motion.div
                  className="h-full"
                  initial={{ width: "0%" }}
                  animate={{ width: complete ? "100%" : `${(visibleSteps / STEPS.length) * 95}%` }}
                  transition={{ duration: 0.5 }}
                  style={{
                    background: "linear-gradient(90deg, #00f5ff, #a855f7)",
                    boxShadow: "0 0 8px rgba(0,245,255,0.6)",
                  }}
                />
              </div>
            </motion.div>
          </div>

          {/* Bottom label */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs font-mono text-slate-700 tracking-widest">
            gameinfocode.vercel.app
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
