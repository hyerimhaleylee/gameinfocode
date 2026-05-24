"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, password: pw }),
    });
    if (res.ok) router.push("/admin/dashboard");
    else setError("인증 실패");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#090f1e]">
      <div className="w-full max-w-sm p-8 border border-cyan-500/20">
        <p className="text-[10px] font-mono text-cyan-400/60 tracking-[0.3em] mb-8">
          ADMIN · GAMEINFOCODE
        </p>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <input type="text" value={id} onChange={e => setId(e.target.value)}
            placeholder="ID"
            className="bg-transparent border border-cyan-500/20 px-4 py-3 font-mono text-sm text-white placeholder-slate-700 focus:outline-none focus:border-cyan-500/50"
          />
          <input type="password" value={pw} onChange={e => setPw(e.target.value)}
            placeholder="PASSWORD"
            className="bg-transparent border border-cyan-500/20 px-4 py-3 font-mono text-sm text-white placeholder-slate-700 focus:outline-none focus:border-cyan-500/50"
          />
          {error && <p className="text-red-400/60 text-xs font-mono">{error}</p>}
          <button type="submit"
            className="mt-2 py-3 border border-cyan-500/30 text-cyan-400 font-mono text-xs tracking-[0.2em] hover:bg-cyan-500/10 transition-colors">
            AUTHENTICATE
          </button>
        </form>
      </div>
    </main>
  );
}
