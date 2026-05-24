"use client";
import { useRouter } from "next/navigation";

type Stats = { daily: number; monthly: number; yearly: number; total: number };
type Props = {
  data: {
    visits: Stats;
    searches: Stats;
    topQueries: { query: string; count: number }[];
  };
};

function StatCard({ label, stats }: { label: string; stats: Stats }) {
  return (
    <div className="border border-cyan-500/15 p-6">
      <p className="text-[10px] font-mono text-cyan-400/50 tracking-[0.25em] mb-4">{label}</p>
      <div className="grid grid-cols-4 gap-4">
        {[
          { k: "일간", v: stats.daily },
          { k: "월간", v: stats.monthly },
          { k: "연간", v: stats.yearly },
          { k: "누적", v: stats.total },
        ].map(({ k, v }) => (
          <div key={k} className="text-center">
            <p className="text-2xl font-bold text-white font-mono">{v.toLocaleString()}</p>
            <p className="text-[9px] font-mono text-slate-600 mt-1 tracking-widest">{k}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboardClient({ data }: Props) {
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
  };

  return (
    <main className="min-h-screen bg-[#090f1e] p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <p className="text-[10px] font-mono text-cyan-400/60 tracking-[0.3em]">
          ADMIN DASHBOARD · GAMEINFOCODE
        </p>
        <button
          onClick={logout}
          className="text-[10px] font-mono text-slate-600 hover:text-slate-400 tracking-widest transition-colors"
        >
          LOGOUT
        </button>
      </div>

      <div className="flex flex-col gap-4 mb-8">
        <StatCard label="PAGE VISITS" stats={data.visits} />
        <StatCard label="SEARCHES" stats={data.searches} />
      </div>

      <div className="border border-cyan-500/15 p-6">
        <p className="text-[10px] font-mono text-cyan-400/50 tracking-[0.25em] mb-4">
          TOP 10 SEARCHES · THIS MONTH
        </p>
        {data.topQueries.length === 0 ? (
          <p className="text-slate-700 font-mono text-xs">데이터 없음</p>
        ) : (
          <table className="w-full">
            <tbody>
              {data.topQueries.map(({ query, count }, i) => (
                <tr key={query} className="border-b border-white/4 last:border-0">
                  <td className="py-2 w-8 text-[10px] font-mono text-slate-700">
                    {String(i + 1).padStart(2, "0")}
                  </td>
                  <td className="py-2 font-mono text-sm text-slate-300 tracking-widest">{query}</td>
                  <td className="py-2 text-right font-mono text-sm text-cyan-400/70">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
