"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

const NAV_LINKS = ["Analyze", "Leaderboard", "Personas", "Community"];

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
          ? "bg-[#050810]/85 backdrop-blur-2xl border-b border-cyan-500/15"
          : "bg-transparent backdrop-blur-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button onClick={onReset} className="flex items-center gap-2 group">
            <div className="w-7 h-7 border border-cyan-400/60 flex items-center justify-center">
              <div className="w-3 h-3 bg-cyan-400" style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }} />
            </div>
            <span className="text-lg font-bold tracking-[0.2em] text-white">
              GAME<span className="text-cyan-400 neon-text-cyan">CODE</span>
            </span>
          </button>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((item) => (
              <Link
                key={item}
                href="#"
                className="text-xs font-medium text-slate-400 hover:text-cyan-400 transition-colors duration-200 tracking-[0.15em] uppercase"
              >
                {item}
              </Link>
            ))}
          </div>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button className="px-4 py-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors tracking-widest uppercase">
              Login
            </button>
            <button
              className="px-5 py-1.5 text-xs font-bold tracking-widest uppercase text-black bg-cyan-400 hover:bg-cyan-300 transition-all duration-200"
              style={{ boxShadow: "0 0 16px rgba(0,245,255,0.4)" }}
            >
              Sign Up
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden flex flex-col gap-1.5 p-1"
          >
            <span className={`block w-5 h-0.5 bg-cyan-400 transition-all ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-5 h-0.5 bg-cyan-400 transition-all ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-cyan-400 transition-all ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-cyan-500/15 py-4 space-y-3">
            {NAV_LINKS.map((item) => (
              <Link
                key={item}
                href="#"
                className="block text-xs text-slate-400 hover:text-cyan-400 tracking-widest uppercase py-1"
              >
                {item}
              </Link>
            ))}
            <div className="flex gap-3 pt-2">
              <button className="text-xs text-slate-400 tracking-widest uppercase">Login</button>
              <button className="px-4 py-1.5 text-xs font-bold text-black bg-cyan-400 tracking-widest uppercase">Sign Up</button>
            </div>
          </div>
        )}
      </div>
    </motion.nav>
  );
}
