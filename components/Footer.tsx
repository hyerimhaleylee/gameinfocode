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
            <Link href="/" onClick={onReset} className="flex items-center gap-2.5 mb-4 w-fit group">
              {/* HUD bracket frame + mini radar chart */}
              <div className="relative w-8 h-8 flex items-center justify-center">
                <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-[1.5px] border-l-[1.5px] border-cyan-400/50" />
                <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-[1.5px] border-r-[1.5px] border-cyan-400/50" />
                <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-[1.5px] border-l-[1.5px] border-cyan-400/50" />
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-[1.5px] border-r-[1.5px] border-cyan-400/50" />
                <svg width="19" height="19" viewBox="0 0 22 22" fill="none">
                  <polygon points="11,2.5 17.7,6.25 17.7,13.75 11,17.5 4.3,13.75 4.3,6.25"
                    fill="none" stroke="rgba(34,211,238,0.18)" strokeWidth="0.6" />
                  <polygon points="11,5.5 14.8,7.6 14.8,12.4 11,14.5 7.2,12.4 7.2,7.6"
                    fill="none" stroke="rgba(34,211,238,0.1)" strokeWidth="0.5" />
                  <polygon points="11,3.5 16.5,8 16,13.5 11,16.8 5.5,13 6.5,7.5"
                    fill="rgba(34,211,238,0.12)" stroke="#22d3ee" strokeWidth="0.9" />
                  <circle cx="11" cy="11" r="1.2" fill="#22d3ee" />
                </svg>
              </div>
              {/* Stacked text */}
              <div className="flex flex-col justify-center gap-[2px] leading-none">
                <span className="text-[8px] font-mono tracking-[0.5em] text-slate-400">GAME</span>
                <span className="text-[13px] font-black tracking-[0.08em] text-white">CODE</span>
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
        <div className="border-t border-white/5 pt-6 flex items-center justify-between">
          <p className="text-slate-500 text-xs font-mono">
            © 2026 GAMECODE. All rights reserved.
          </p>
          <p className="text-slate-500 text-xs font-mono tracking-widest">
            Made by <Link href="/admin" className="text-cyan-400">OTTANK</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
