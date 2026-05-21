"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface Props {
  onSearch: (query: string) => void;
}

function BackgroundRadar({ size = 420 }: { size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.44;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="overflow-visible opacity-15"
    >
      {[0.3, 0.55, 0.8, 1.0].map((s, i) => (
        <circle key={i} cx={cx} cy={cy} r={r * s}
          fill="none" stroke="rgba(0,245,255,1)"
          strokeWidth={s === 1 ? 0.8 : 0.5}
          strokeDasharray={s < 1 ? "3 10" : undefined}
        />
      ))}
      <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="rgba(0,245,255,0.6)" strokeWidth="0.5" />
      <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke="rgba(0,245,255,0.6)" strokeWidth="0.5" />
      {[45, 135].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <line key={deg}
            x1={cx - r * Math.cos(rad)} y1={cy - r * Math.sin(rad)}
            x2={cx + r * Math.cos(rad)} y2={cy + r * Math.sin(rad)}
            stroke="rgba(0,245,255,0.3)" strokeWidth="0.4"
          />
        );
      })}
      <motion.g
        animate={{ rotate: 360 }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      >
        {Array.from({ length: 20 }, (_, i) => {
          const angle = -(i + 1) * 5;
          const rad = (angle * Math.PI) / 180;
          const opacity = Math.max(0, 0.6 - i * 0.03);
          return (
            <line key={i} x1={cx} y1={cy}
              x2={cx + r * Math.cos(rad)} y2={cy + r * Math.sin(rad)}
              stroke={`rgba(0,245,255,${opacity})`} strokeWidth="1"
            />
          );
        })}
        <line x1={cx} y1={cy} x2={cx + r} y2={cy}
          stroke="rgba(0,245,255,1)" strokeWidth="1.2"
        />
      </motion.g>
    </svg>
  );
}

const HISTORY_KEY = "gameinfocode:history";
const MAX_HISTORY = 6;

function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) setHistory(JSON.parse(stored));
    } catch {}
  }, []);

  const add = (name: string) => {
    setHistory((prev) => {
      const filtered = prev.filter((h) => h.toLowerCase() !== name.toLowerCase());
      const updated = [name, ...filtered].slice(0, MAX_HISTORY);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const remove = (name: string) => {
    setHistory((prev) => {
      const updated = prev.filter((h) => h !== name);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return { history, add, remove };
}

export default function HeroSection({ onSearch }: Props) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const { history, add: addHistory, remove: removeHistory } = useSearchHistory();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();

    type Particle = { x: number; y: number; vx: number; vy: number; size: number; opacity: number };
    const particles: Particle[] = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      size: Math.random() * 1.2 + 0.2,
      opacity: Math.random() * 0.35 + 0.06,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,245,255,${p.opacity})`;
        ctx.fill();
      });
      animRef.current = requestAnimationFrame(animate);
    };
    animate();

    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const handleSubmit = () => {
    if (!query.trim()) return;
    addHistory(query.trim());
    setShowHistory(false);
    onSearch(query.trim());
  };

  const handleHistorySelect = (name: string) => {
    setQuery(name);
    addHistory(name);
    setShowHistory(false);
    onSearch(name);
  };

  const handleHistoryRemove = (name: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    removeHistory(name);
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />
      <div className="absolute inset-0 tactical-grid z-0" />
      <div className="scan-lines" />

      {/* Background radar — centered, large, subtle */}
      <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
        <BackgroundRadar size={520} />
      </div>

      {/* Vignette */}
      <div className="absolute inset-0 z-0" style={{
        background: "radial-gradient(ellipse 75% 65% at 50% 50%, transparent 10%, rgba(20,26,34,0.55) 65%, #141a22 100%)"
      }} />

      {/* HUD corner brackets */}
      {["top-20 left-8 border-l-2 border-t-2", "top-20 right-8 border-r-2 border-t-2",
        "bottom-20 left-8 border-l-2 border-b-2", "bottom-20 right-8 border-r-2 border-b-2"].map((cls, i) => (
        <div key={i} className={`absolute w-14 h-14 ${cls} border-cyan-500/30 z-10`} />
      ))}

      {/* Side ruler ticks */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 hidden lg:flex flex-col gap-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className={`h-px bg-cyan-500/20 ${i === 2 ? "w-6" : "w-3"}`} />
            <span className="text-[9px] font-mono text-cyan-500/20">{String(i + 1).padStart(2, "0")}</span>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center px-4 max-w-3xl mx-auto pt-20">
        {/* System badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-3 px-4 py-2 mb-10 border border-cyan-500/20"
          style={{ background: "rgba(0,245,255,0.04)" }}
        >
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-cyan-400"
          />
          <span className="text-[10px] font-mono text-cyan-400/80 tracking-[0.25em] uppercase">
            Tactical AI Analysis System · PUBG · Online
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.7 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.08] tracking-tight mb-5"
        >
          <span className="text-white">AI가 읽어주는</span>
          <br />
          <span className="text-transparent bg-clip-text"
            style={{ backgroundImage: "linear-gradient(135deg, #00f5ff 0%, #a855f7 100%)" }}>
            당신의 배틀그라운드
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-slate-500 text-base sm:text-lg mb-12 tracking-wide"
        >
          전적은 숫자가 아니라 플레이 스타일입니다.
        </motion.p>

        {/* ── Military-style input ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="max-w-xl mx-auto"
        >
          {/* Input label */}
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[10px] font-mono text-cyan-400/50 tracking-[0.25em] uppercase">
              PLAYER ID ENTRY
            </span>
            <span className="text-[10px] font-mono text-slate-700 tracking-widest">
              SYS.COMBAT.SCAN
            </span>
          </div>

          {/* Input frame — outer border */}
          <div
            className="p-[1px] transition-all duration-300"
            style={{
              background: focused
                ? "linear-gradient(135deg, rgba(0,245,255,0.6), rgba(168,85,247,0.4))"
                : "linear-gradient(135deg, rgba(0,245,255,0.2), rgba(168,85,247,0.1))",
            }}
          >
            <div
              className="flex items-center"
              style={{ background: "rgba(2,8,18,0.97)" }}
            >
              {/* Prompt */}
              <div
                className="flex items-center gap-2 pl-4 pr-3 py-4 border-r border-cyan-500/15 shrink-0"
                style={{ background: "rgba(0,245,255,0.04)" }}
              >
                <span className="text-cyan-400 text-xs font-mono font-bold tracking-widest">SCAN ▸</span>
              </div>

              {/* Input */}
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                  if (e.key === "Escape") setShowHistory(false);
                }}
                onFocus={() => { setFocused(true); if (history.length > 0) setShowHistory(true); }}
                onBlur={() => { setFocused(false); setTimeout(() => setShowHistory(false), 150); }}
                placeholder="Enter callsign…"
                className="flex-1 px-4 py-4 bg-transparent font-mono text-white text-sm tracking-widest placeholder-slate-700 focus:outline-none"
              />

              {/* Blinking cursor when focused */}
              {focused && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="text-cyan-400 font-mono text-sm mr-3"
                >_</motion.span>
              )}

              {/* Submit button */}
              <button
                onClick={handleSubmit}
                className="px-6 py-4 text-[11px] font-mono font-bold text-black tracking-[0.2em] uppercase shrink-0 transition-all duration-200"
                style={{
                  background: query.trim()
                    ? "linear-gradient(135deg, #00f5ff, #00d4e8)"
                    : "rgba(0,245,255,0.15)",
                  color: query.trim() ? "#000" : "rgba(0,245,255,0.3)",
                  boxShadow: query.trim() ? "0 0 20px rgba(0,245,255,0.4)" : "none",
                }}
              >
                ANALYZE
              </button>
            </div>
          </div>

          {/* History dropdown */}
          {showHistory && history.length > 0 && (
            <div
              className="mt-px border border-cyan-500/15 overflow-hidden"
              style={{ background: "rgba(2,8,18,0.97)" }}
            >
              <p className="px-4 py-1.5 text-[9px] font-mono text-slate-700 tracking-[0.2em] border-b border-white/5">
                RECENT
              </p>
              {history.map((name) => (
                <div
                  key={name}
                  onMouseDown={() => handleHistorySelect(name)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-cyan-500/6 cursor-pointer group border-b border-white/4 last:border-0"
                >
                  <span className="text-slate-600 text-xs font-mono">↺</span>
                  <span className="flex-1 text-sm font-mono text-slate-300 group-hover:text-white tracking-widest transition-colors">
                    {name}
                  </span>
                  <button
                    onMouseDown={(e) => handleHistoryRemove(name, e)}
                    className="text-slate-700 hover:text-slate-400 text-xs transition-colors px-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Hint */}
          <p className="text-[10px] font-mono text-slate-700 mt-2 text-right tracking-widest">
            PRESS ENTER OR CLICK ANALYZE
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="flex items-center justify-center gap-10 mt-16"
        >
          {[
            { val: "50K+", label: "Players Scanned" },
            { val: "15", label: "Persona Types" },
            { val: "98%", label: "Pattern Accuracy" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-xl font-bold text-white">{s.val}</p>
              <p className="text-[10px] font-mono text-slate-600 tracking-[0.18em] uppercase mt-0.5">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-48 z-10"
        style={{ background: "linear-gradient(to top, #141a22, transparent)" }} />
    </section>
  );
}
