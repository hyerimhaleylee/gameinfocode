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
            <button onClick={onReset} className="flex items-center gap-2 mb-4 w-fit">
              <div className="w-6 h-6 border border-cyan-400/60 flex items-center justify-center">
                <div className="w-2.5 h-2.5 bg-cyan-400" style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }} />
              </div>
              <span className="text-lg font-bold tracking-[0.2em] text-white">
                GAME<span className="text-cyan-400">CODE</span>
              </span>
            </button>
            <p className="text-slate-600 text-sm leading-relaxed max-w-xs mb-5">
              AI가 읽어주는 당신의 게임.<br />
              플레이 데이터를 분석하여 전술 리포트와 AI 코칭을 제공합니다.
            </p>
            <p className="text-xs text-slate-700 font-mono tracking-widest">
              gameinfocode.com
            </p>
          </div>

          {/* Platform links */}
          <div>
            <p className="text-[10px] font-bold tracking-[0.25em] text-slate-500 uppercase mb-5">
              Platform
            </p>
            <div className="space-y-3">
              {["Analyze", "Leaderboard", "Personas", "Community", "API Docs"].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="block text-sm text-slate-600 hover:text-cyan-400 transition-colors duration-200"
                >
                  {item}
                </a>
              ))}
            </div>
          </div>

          {/* Connect */}
          <div>
            <p className="text-[10px] font-bold tracking-[0.25em] text-slate-500 uppercase mb-5">
              Connect
            </p>
            <div className="space-y-3">
              {[
                { name: "Twitter / X", handle: "@gamecode_gg" },
                { name: "Discord", handle: "discord.gg/gamecode" },
                { name: "GitHub", handle: "github.com/gamecode" },
              ].map((s) => (
                <a
                  key={s.name}
                  href="#"
                  className="block group"
                >
                  <span className="text-sm text-slate-600 group-hover:text-cyan-400 transition-colors duration-200">
                    {s.name}
                  </span>
                  <span className="block text-xs text-slate-700 font-mono mt-0.5">{s.handle}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-slate-700 text-xs font-mono">
            © 2026 GAMECODE. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {["Privacy Policy", "Terms of Service"].map((item) => (
              <a key={item} href="#" className="text-xs text-slate-700 hover:text-slate-500 transition-colors">
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
