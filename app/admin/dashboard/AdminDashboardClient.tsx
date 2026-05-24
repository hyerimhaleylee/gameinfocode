"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

type Stats = { daily: number; monthly: number; yearly: number; total: number };
type Props = {
  data: {
    visits: Stats;
    searches: Stats;
    topQueries: { query: string; count: number }[];
  };
};

function StatCell({ label, value, delay }: { label: string; value: number; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="text-center"
    >
      <p className="text-2xl font-bold text-white font-mono">{value.toLocaleString()}</p>
      <p className="text-[9px] font-mono text-slate-600 mt-1 tracking-widest">{label}</p>
    </motion.div>
  );
}

function CompareBar({ label, visits, searches }: { label: string; visits: number; searches: number }) {
  const max = Math.max(visits, searches, 1);
  return (
    <div className="space-y-1.5">
      <p className="text-[9px] font-mono text-slate-600 tracking-widest">{label}</p>
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-mono text-cyan-400 w-14 text-right shrink-0">{visits.toLocaleString()}</span>
        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-cyan-400/60 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(visits / max) * 100}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-mono text-purple-400 w-14 text-right shrink-0">{searches.toLocaleString()}</span>
        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-purple-400/60 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(searches / max) * 100}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          />
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardClient({ data }: Props) {
  const router = useRouter();
  const { visits, searches, topQueries } = data;
  const maxCount = topQueries[0]?.count ?? 1;

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
  };

  return (
    <main className="min-h-screen bg-[#090f1e] p-6 md:p-10 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-8 h-8 flex items-center justify-center">
            <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-[1.5px] border-l-[1.5px] border-cyan-400/50 group-hover:border-cyan-400 transition-colors" />
            <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-[1.5px] border-r-[1.5px] border-cyan-400/50 group-hover:border-cyan-400 transition-colors" />
            <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-[1.5px] border-l-[1.5px] border-cyan-400/50 group-hover:border-cyan-400 transition-colors" />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-[1.5px] border-r-[1.5px] border-cyan-400/50 group-hover:border-cyan-400 transition-colors" />
            <svg width="19" height="19" viewBox="0 0 22 22" fill="none">
              <polygon points="11,2.5 17.7,6.25 17.7,13.75 11,17.5 4.3,13.75 4.3,6.25" fill="none" stroke="rgba(34,211,238,0.18)" strokeWidth="0.6" />
              <polygon points="11,5.5 14.8,7.6 14.8,12.4 11,14.5 7.2,12.4 7.2,7.6" fill="none" stroke="rgba(34,211,238,0.1)" strokeWidth="0.5" />
              <polygon points="11,3.5 16.5,8 16,13.5 11,16.8 5.5,13 6.5,7.5" fill="rgba(34,211,238,0.12)" stroke="#22d3ee" strokeWidth="0.9" />
              <circle cx="11" cy="11" r="1.2" fill="#22d3ee" />
            </svg>
          </div>
          <div className="flex flex-col justify-center gap-[2px] leading-none">
            <span className="text-[8px] font-mono tracking-[0.5em] text-slate-400 group-hover:text-cyan-400/60 transition-colors">GAME</span>
            <span className="text-[13px] font-black tracking-[0.08em] text-white group-hover:text-cyan-400 transition-colors">CODE</span>
          </div>
        </Link>
        <div className="flex items-center gap-5">
          <p className="text-[10px] font-mono text-cyan-400/30 tracking-[0.25em] hidden md:block">ADMIN DASHBOARD</p>
          <button
            onClick={logout}
            className="text-[10px] font-mono text-slate-600 hover:text-slate-300 tracking-widest transition-colors border border-white/5 hover:border-white/15 px-3 py-1.5"
          >
            LOGOUT
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="border border-cyan-500/15 p-6 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(0,245,255,0.25), transparent)" }} />
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <p className="text-[10px] font-mono text-cyan-400/70 tracking-[0.25em]">PAGE VISITS</p>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[{ k: "일간", v: visits.daily }, { k: "월간", v: visits.monthly }, { k: "연간", v: visits.yearly }, { k: "누적", v: visits.total }].map(({ k, v }, i) => (
              <StatCell key={k} label={k} value={v} delay={i * 0.05} />
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
          className="border border-purple-500/15 p-6 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(168,85,247,0.25), transparent)" }} />
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            <p className="text-[10px] font-mono text-purple-400/70 tracking-[0.25em]">SEARCHES</p>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[{ k: "일간", v: searches.daily }, { k: "월간", v: searches.monthly }, { k: "연간", v: searches.yearly }, { k: "누적", v: searches.total }].map(({ k, v }, i) => (
              <StatCell key={k} label={k} value={v} delay={0.1 + i * 0.05} />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Compare bar chart */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
        className="border border-white/5 p-6 mb-4"
      >
        <div className="flex items-center justify-between mb-6">
          <p className="text-[10px] font-mono text-slate-500 tracking-[0.25em]">VISITS vs SEARCHES</p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-cyan-400/60" />
              <span className="text-[9px] font-mono text-slate-600">방문</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-purple-400/60" />
              <span className="text-[9px] font-mono text-slate-600">검색</span>
            </div>
          </div>
        </div>
        <div className="space-y-5">
          <CompareBar label="일간" visits={visits.daily} searches={searches.daily} />
          <CompareBar label="월간" visits={visits.monthly} searches={searches.monthly} />
          <CompareBar label="연간" visits={visits.yearly} searches={searches.yearly} />
          <CompareBar label="누적" visits={visits.total} searches={searches.total} />
        </div>
      </motion.div>

      {/* Top searches */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}
        className="border border-white/5 p-6"
      >
        <p className="text-[10px] font-mono text-slate-500 tracking-[0.25em] mb-6">TOP 10 SEARCHES · THIS MONTH</p>
        {topQueries.length === 0 ? (
          <p className="text-slate-700 font-mono text-xs">데이터 없음</p>
        ) : (
          <div className="space-y-4">
            {topQueries.map(({ query, count }, i) => (
              <div key={query} className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-slate-700 w-5 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs text-slate-300 tracking-widest truncate">{query}</span>
                    <span className="font-mono text-xs text-cyan-400/70 ml-3 shrink-0">{count}</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(90deg, rgba(0,245,255,0.55), rgba(168,85,247,0.45))" }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / maxCount) * 100}%` }}
                      transition={{ duration: 0.7, ease: "easeOut", delay: 0.35 + i * 0.04 }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </main>
  );
}
