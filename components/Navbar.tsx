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
          ? "bg-[#141a22]/88 backdrop-blur-2xl border-b border-cyan-500/20"
          : "bg-transparent backdrop-blur-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" onClick={onReset} className="flex items-center gap-2 group">
            <div className="w-7 h-7 border border-cyan-400/60 flex items-center justify-center">
              <div className="w-3 h-3 bg-cyan-400" style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }} />
            </div>
            <span className="text-lg font-bold tracking-[0.2em] text-white">
              GAME<span className="text-cyan-400 neon-text-cyan">CODE</span>
            </span>
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
