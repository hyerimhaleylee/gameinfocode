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
            {/* HUD bracket frame + mini radar chart */}
            <div className="relative w-9 h-9 flex items-center justify-center">
              <div className="absolute top-0 left-0 w-3 h-3 border-t-[1.5px] border-l-[1.5px] border-cyan-400/60 group-hover:border-cyan-400/90 transition-colors duration-300" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t-[1.5px] border-r-[1.5px] border-cyan-400/60 group-hover:border-cyan-400/90 transition-colors duration-300" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-[1.5px] border-l-[1.5px] border-cyan-400/60 group-hover:border-cyan-400/90 transition-colors duration-300" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-[1.5px] border-r-[1.5px] border-cyan-400/60 group-hover:border-cyan-400/90 transition-colors duration-300" />
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <polygon points="11,2.5 17.7,6.25 17.7,13.75 11,17.5 4.3,13.75 4.3,6.25"
                  fill="none" stroke="rgba(34,211,238,0.2)" strokeWidth="0.6" />
                <polygon points="11,5.5 14.8,7.6 14.8,12.4 11,14.5 7.2,12.4 7.2,7.6"
                  fill="none" stroke="rgba(34,211,238,0.12)" strokeWidth="0.5" />
                <polygon points="11,3.5 16.5,8 16,13.5 11,16.8 5.5,13 6.5,7.5"
                  fill="rgba(34,211,238,0.14)" stroke="#22d3ee" strokeWidth="0.9" />
                <circle cx="11" cy="11" r="1.2" fill="#22d3ee" />
              </svg>
            </div>

            {/* Stacked text */}
            <div className="flex flex-col justify-center gap-[2px] leading-none">
              <span className="text-[8px] font-mono tracking-[0.5em] text-slate-400">GAME</span>
              <span className="text-[13px] font-black tracking-[0.08em] text-white group-hover:text-cyan-400 transition-colors duration-300">CODE</span>
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
