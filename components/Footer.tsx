import Link from "next/link";

export default function Footer({ onReset }: { onReset?: () => void }) {
  return (
    <footer className="border-t border-white/5 pt-16 pb-8 px-4 relative">
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(0,245,255,0.2), rgba(168,85,247,0.2), transparent)" }}
      />

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" onClick={onReset} className="flex items-center gap-2.5 mb-4 w-fit">
              {/* Static radar icon */}
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="12" stroke="rgba(34,211,238,0.22)" strokeWidth="0.8" />
                <circle cx="14" cy="14" r="7.5" stroke="rgba(34,211,238,0.14)" strokeWidth="0.6" strokeDasharray="2 3" />
                <circle cx="14" cy="14" r="3.5" stroke="rgba(34,211,238,0.12)" strokeWidth="0.5" />
                <line x1="14" y1="2" x2="14" y2="26" stroke="rgba(34,211,238,0.07)" strokeWidth="0.6" />
                <line x1="2" y1="14" x2="26" y2="14" stroke="rgba(34,211,238,0.07)" strokeWidth="0.6" />
                <line x1="14" y1="14" x2="25" y2="8.5" stroke="rgba(34,211,238,0.5)" strokeWidth="1.2" strokeLinecap="round" />
                <circle cx="21" cy="9.5" r="2.5" fill="#22d3ee" opacity="0.12" />
                <circle cx="21" cy="9.5" r="1.3" fill="#22d3ee" opacity="0.75" />
              </svg>
              {/* Stacked text */}
              <div className="flex flex-col justify-center gap-[2px] leading-none">
                <span className="text-[8px] font-mono tracking-[0.55em] text-slate-400 uppercase">GAME</span>
                <span className="text-[13px] font-black tracking-[0.1em] text-cyan-400 uppercase"
                  style={{ textShadow: "0 0 12px rgba(34,211,238,0.6)" }}>CODE</span>
              </div>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs mb-5">
              AI가 읽어주는 당신의 게임.<br />
              플레이 데이터를 분석하여 전술 리포트와 AI 코칭을 제공합니다.
            </p>
            <p className="text-xs text-slate-500 font-mono tracking-widest">
              gameinfocode.vercel.app
            </p>
          </div>

          {/* Platform links */}
          <div>
            <p className="text-[10px] font-bold tracking-[0.25em] text-slate-400 uppercase mb-5">
              Platform
            </p>
            <div className="space-y-3">
              <Link href="/" onClick={onReset} className="block text-sm text-slate-400 hover:text-cyan-400 transition-colors duration-200">Analyze</Link>
              <Link href="/leaderboard" className="block text-sm text-slate-400 hover:text-cyan-400 transition-colors duration-200">Leaderboard</Link>
              <Link href="/persona" className="block text-sm text-slate-400 hover:text-cyan-400 transition-colors duration-200">Personas</Link>
            </div>
          </div>

          {/* Empty column for spacing */}
          <div />
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-6 flex items-center justify-center">
          <p className="text-slate-500 text-xs font-mono">
            © 2026 GAMECODE. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
