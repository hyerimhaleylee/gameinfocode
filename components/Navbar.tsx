"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

const NAV_LINKS = [
  { label: "Analyze", href: "/" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Personas", href: "/persona" },
];

export default function Navbar({ onReset }: { onReset?: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 ${
        scrolled
          ? "bg-[#090f1e]/92 backdrop-blur-2xl border-b border-cyan-500/20"
          : "bg-transparent backdrop-blur-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" onClick={onReset} className="flex items-center gap-3 group">
            {/* HUD bracket frame + radar icon */}
            <div className="relative w-11 h-11 flex items-center justify-center flex-shrink-0">
              {/* Corners — bolder */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400/80 group-hover:border-cyan-400 transition-colors duration-200" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400/80 group-hover:border-cyan-400 transition-colors duration-200" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400/80 group-hover:border-cyan-400 transition-colors duration-200" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400/80 group-hover:border-cyan-400 transition-colors duration-200" />
              {/* Subtle inner glow on hover */}
              <div className="absolute inset-1 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{ background: "radial-gradient(ellipse at center, rgba(34,211,238,0.08) 0%, transparent 70%)" }} />
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                {/* Outer ring */}
                <polygon points="14,2.5 22.5,7 22.5,17 14,21.5 5.5,17 5.5,7"
                  fill="none" stroke="rgba(34,211,238,0.22)" strokeWidth="0.7" />
                {/* Mid ring */}
                <polygon points="14,6 19.8,9.25 19.8,15.75 14,19 8.2,15.75 8.2,9.25"
                  fill="none" stroke="rgba(34,211,238,0.13)" strokeWidth="0.5" />
                {/* Main filled shape */}
                <polygon points="14,4 21,9 20.5,17 14,21 7.5,16.5 8,9"
                  fill="rgba(34,211,238,0.13)" stroke="#22d3ee" strokeWidth="1.3" />
                {/* Center pulse rings */}
                <circle cx="14" cy="14" r="3.5" fill="none" stroke="rgba(34,211,238,0.25)" strokeWidth="0.6" />
                <circle cx="14" cy="14" r="1.7" fill="#22d3ee"
                  style={{ filter: "drop-shadow(0 0 3px #22d3ee)" }} />
              </svg>
            </div>

            {/* Text block */}
            <div className="flex flex-col justify-center leading-none gap-[3px]">
              <span className="text-[9px] font-mono tracking-[0.38em] text-cyan-400/65 group-hover:text-cyan-400/90 transition-colors duration-200 uppercase">
                GAME·INFO
              </span>
              <span
                className="text-[20px] font-black tracking-[0.04em] text-white group-hover:text-cyan-300 transition-colors duration-200"
                style={{ textShadow: "0 0 24px rgba(34,211,238,0.18)", lineHeight: 1 }}
              >
                CODE
              </span>
            </div>
          </Link>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-xs font-medium text-slate-400 hover:text-cyan-400 transition-colors duration-200 tracking-[0.15em] uppercase"
              >
                {item.label}
              </Link>
            ))}
          </div>


          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden flex flex-col justify-center items-center gap-[5px] min-w-[44px] min-h-[44px] p-2.5 rounded border border-cyan-500/20 bg-cyan-500/5 active:bg-cyan-500/15 transition-colors"
            aria-label="메뉴"
          >
            <span className={`block w-5 h-[2px] bg-cyan-400 rounded-full transition-all duration-200 ${menuOpen ? "rotate-45 translate-y-[7px]" : ""}`} />
            <span className={`block w-5 h-[2px] bg-cyan-400 rounded-full transition-all duration-200 ${menuOpen ? "opacity-0 scale-x-0" : ""}`} />
            <span className={`block w-5 h-[2px] bg-cyan-400 rounded-full transition-all duration-200 ${menuOpen ? "-rotate-45 -translate-y-[7px]" : ""}`} />
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-cyan-500/15 py-4 space-y-3">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="block text-xs text-slate-400 hover:text-cyan-400 tracking-widest uppercase py-1"
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </motion.nav>
  );
}
