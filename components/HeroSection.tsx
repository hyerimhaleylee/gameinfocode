"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LOADING_STEPS = [
  "Telemetry Scan Initialized…",
  "Combat Pattern Detected…",
  "Behavioral Matrix Loading…",
  "Generating Player Profile…",
];

export default function HeroSection() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
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
    const particles: Particle[] = Array.from({ length: 70 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      size: Math.random() * 1.4 + 0.3,
      opacity: Math.random() * 0.4 + 0.08,
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
        ctx.fillStyle = `rgba(0, 245, 255, ${p.opacity})`;
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

  const handleAnalyze = () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setLoadingStep(0);
    let step = 0;
    const iv = setInterval(() => {
      step++;
      if (step >= LOADING_STEPS.length) {
        clearInterval(iv);
        return;
      }
      setLoadingStep(step);
    }, 750);
  };

  const handleReset = () => {
    setIsLoading(false);
    setLoadingStep(0);
    setQuery("");
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Canvas particles */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Tactical grid */}
      <div className="absolute inset-0 tactical-grid z-0" />

      {/* Scan lines */}
      <div className="scan-lines" />

      {/* Radial vignette */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, transparent 20%, rgba(5,8,16,0.6) 70%, #050810 100%)",
        }}
      />

      {/* HUD corner decorations */}
      {[
        "top-20 left-8 border-l-2 border-t-2",
        "top-20 right-8 border-r-2 border-t-2",
        "bottom-20 left-8 border-l-2 border-b-2",
        "bottom-20 right-8 border-r-2 border-b-2",
      ].map((cls, i) => (
        <div key={i} className={`absolute w-12 h-12 ${cls} border-cyan-500/30 z-10`} />
      ))}

      {/* Crosshair center dot */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 opacity-5">
        <div className="w-64 h-64 border border-cyan-400 rounded-full" />
        <div className="absolute inset-4 border border-cyan-400/60 rounded-full" />
        <div className="absolute top-1/2 left-0 right-0 h-px bg-cyan-400/40" />
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-cyan-400/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto pt-20">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 mb-10 border border-cyan-500/25 bg-cyan-500/5 text-cyan-400 text-xs tracking-[0.2em] uppercase"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          AI Tactical Analysis Platform · PUBG
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.7 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-5 leading-[1.1] tracking-tight"
        >
          <span className="text-white">AI가 읽어주는</span>
          <br />
          <span
            className="text-transparent bg-clip-text"
            style={{
              backgroundImage: "linear-gradient(135deg, #00f5ff 0%, #a855f7 100%)",
            }}
          >
            당신의 배틀그라운드
          </span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-slate-400 text-base sm:text-lg mb-12 tracking-wide"
        >
          당신의 전적은 숫자가 아니라 플레이 스타일입니다.
        </motion.p>

        {/* Search / Loading */}
        <AnimatePresence mode="wait">
          {!isLoading ? (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ delay: 0.65, duration: 0.5 }}
              className="flex flex-col sm:flex-row items-center gap-3 max-w-lg mx-auto"
            >
              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                  placeholder="닉네임 입력 (예: Ottank)"
                  className="w-full px-5 py-3.5 bg-white/4 border border-cyan-500/25 text-white placeholder-slate-600 text-sm tracking-wide focus:outline-none focus:border-cyan-400 transition-colors"
                  style={{ background: "rgba(0,245,255,0.03)" }}
                />
              </div>
              <button
                onClick={handleAnalyze}
                className="px-6 py-3.5 text-xs font-bold text-black tracking-[0.2em] uppercase whitespace-nowrap transition-all duration-200 hover:brightness-110"
                style={{
                  background: "linear-gradient(135deg, #00f5ff, #00d4ff)",
                  boxShadow: "0 0 24px rgba(0,245,255,0.45)",
                }}
              >
                Analyze Player
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-lg mx-auto"
            >
              <div
                className="p-6 border border-cyan-500/25"
                style={{ background: "rgba(0,10,20,0.7)", backdropFilter: "blur(12px)" }}
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span className="text-cyan-400 text-xs tracking-[0.18em] uppercase font-mono">
                      Scanning: {query}
                    </span>
                  </div>
                  <button onClick={handleReset} className="text-slate-600 hover:text-slate-400 text-xs transition-colors">
                    ✕ Cancel
                  </button>
                </div>
                <div className="space-y-2.5">
                  {LOADING_STEPS.map((step, i) => (
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className={`flex items-center gap-3 text-sm font-mono transition-all ${
                        i < loadingStep
                          ? "text-cyan-400"
                          : i === loadingStep
                          ? "text-white"
                          : "text-slate-700"
                      }`}
                    >
                      <span className="text-xs w-3">
                        {i < loadingStep ? "✓" : i === loadingStep ? "▸" : "○"}
                      </span>
                      {step}
                      {i === loadingStep && (
                        <span className="text-cyan-400 blink">_</span>
                      )}
                    </motion.div>
                  ))}
                </div>
                {/* Progress bar */}
                <div className="mt-5 h-px bg-white/5 overflow-hidden">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: `${((loadingStep + 1) / LOADING_STEPS.length) * 100}%` }}
                    transition={{ duration: 0.6 }}
                    className="h-full"
                    style={{ background: "linear-gradient(90deg, #00f5ff, #a855f7)", boxShadow: "0 0 8px rgba(0,245,255,0.6)" }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="flex items-center justify-center gap-8 mt-14 text-center"
        >
          {[
            { value: "50K+", label: "Players Analyzed" },
            { value: "12", label: "Persona Types" },
            { value: "98%", label: "Pattern Accuracy" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-slate-600 tracking-widest uppercase mt-0.5">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 z-10" style={{ background: "linear-gradient(to top, #050810, transparent)" }} />
    </section>
  );
}
