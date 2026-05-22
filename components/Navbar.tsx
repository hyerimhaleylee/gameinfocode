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
          <Link href="/" onClick={onReset} className="flex items-center gap-2.5 group">
            {/* Animated radar icon */}
            <div className="relative w-8 h-8 flex-shrink-0">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="absolute inset-0">
                <circle cx="16" cy="16" r="13.5" stroke="rgba(34,211,238,0.22)" strokeWidth="0.8" />
                <circle cx="16" cy="16" r="8.5" stroke="rgba(34,211,238,0.14)" strokeWidth="0.6" strokeDasharray="2 3" />
                <circle cx="16" cy="16" r="4" stroke="rgba(34,211,238,0.12)" strokeWidth="0.5" />
                <line x1="16" y1="2.5" x2="16" y2="29.5" stroke="rgba(34,211,238,0.07)" strokeWidth="0.6" />
                <line x1="2.5" y1="16" x2="29.5" y2="16" stroke="rgba(34,211,238,0.07)" strokeWidth="0.6" />
                <circle cx="21.5" cy="10" r="3" fill="#22d3ee" opacity="0.12" />
                <circle cx="21.5" cy="10" r="1.5" fill="#22d3ee" opacity="0.8" />
              </svg>
              <motion.div
                className="absolute inset-0"
                animate={{ rotate: 360 }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              >
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <line x1="16" y1="16" x2="29.5" y2="16" stroke="rgba(34,211,238,0.6)" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
              </motion.div>
            </div>

            {/* Stacked text */}
            <div className="flex flex-col justify-center gap-[2px] leading-none">
              <span className="text-[8px] font-mono tracking-[0.55em] text-slate-400 uppercase">GAME</span>
              <span className="text-[13px] font-black tracking-[0.1em] text-cyan-400 uppercase"
                style={{ textShadow: "0 0 12px rgba(34,211,238,0.6)" }}>CODE</span>
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
