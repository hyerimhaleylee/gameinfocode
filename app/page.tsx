"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/HowItWorks";
import AICoachingPreview from "@/components/AICoachingPreview";
import RadarChartSection from "@/components/RadarChartSection";
import Footer from "@/components/Footer";
import AnalysisOverlay from "@/components/AnalysisOverlay";
import ResultSection from "@/components/ResultSection";
import type { PlayerApiResponse } from "@/lib/persona";
import type { MatchEntry } from "@/lib/pubg";

type Phase = "landing" | "scanning" | "result";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("landing");
  const [playerName, setPlayerName] = useState("");
  const [playerData, setPlayerData] = useState<PlayerApiResponse | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [seasonLoading, setSeasonLoading] = useState(false);
  const [matches, setMatches] = useState<MatchEntry[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);

  const accountRef = useRef<{ accountId: string; shard: string } | null>(null);
  const fetchPromiseRef = useRef<Promise<PlayerApiResponse | null>>(Promise.resolve(null));

  const buildUrl = (name: string, opts?: { season?: string; accountId?: string; shard?: string; gameType?: string; team?: string }) => {
    const params = new URLSearchParams({ name });
    if (opts?.season) params.set("season", opts.season);
    if (opts?.accountId) params.set("accountId", opts.accountId);
    if (opts?.shard) params.set("shard", opts.shard);
    if (opts?.gameType) params.set("gameType", opts.gameType);
    if (opts?.team) params.set("team", opts.team);
    return `/api/player?${params}`;
  };

  const fetchMatches = useCallback(async (accountId: string, shard: string) => {
    setMatchesLoading(true);
    try {
      const res = await fetch(`/api/matches?accountId=${encodeURIComponent(accountId)}&shard=${encodeURIComponent(shard)}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) setMatches(data);
    } catch {
      // non-critical
    } finally {
      setMatchesLoading(false);
    }
  }, []);

  const handleSearch = useCallback((name: string) => {
    setPlayerName(name);
    setPhase("scanning");
    setPlayerData(null);
    setFetchError(null);
    setMatches([]);
    accountRef.current = null;

    fetchPromiseRef.current = fetch(buildUrl(name))
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "분석 중 오류가 발생했습니다.");
        return json as PlayerApiResponse;
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "네트워크 오류가 발생했습니다.";
        setFetchError(msg);
        return null;
      });
  }, []);

  const handleAnalysisComplete = useCallback(async () => {
    const data = await fetchPromiseRef.current;
    if (data) {
      setPlayerData(data);
      accountRef.current = { accountId: data.accountId, shard: data.shard };
      fetchMatches(data.accountId, data.shard);
    }
    setPhase("result");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [fetchMatches]);

  const handleSeasonChange = useCallback(async (seasonId: string) => {
    if (!playerName) return;
    setSeasonLoading(true);
    setFetchError(null);
    try {
      const cached = accountRef.current;
      const url = buildUrl(playerName, {
        season: seasonId,
        accountId: cached?.accountId,
        shard: cached?.shard,
        // Let API auto-detect the best mode for the new season
      });
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "분석 중 오류가 발생했습니다.");
      setPlayerData(json as PlayerApiResponse);
      accountRef.current = { accountId: json.accountId, shard: json.shard };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "네트워크 오류가 발생했습니다.";
      setFetchError(msg);
    } finally {
      setSeasonLoading(false);
    }
  }, [playerName]);

  const handleModeChange = useCallback(async (gameType: "normal" | "ranked", team: "squad" | "duo" | "solo") => {
    if (!playerName) return;
    setSeasonLoading(true);
    setFetchError(null);
    try {
      const cached = accountRef.current;
      const currentSeason = playerData?.seasonId;
      const url = buildUrl(playerName, {
        season: currentSeason || undefined,
        accountId: cached?.accountId,
        shard: cached?.shard,
        gameType,
        team,
      });
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "분석 중 오류가 발생했습니다.");
      setPlayerData(json as PlayerApiResponse);
      accountRef.current = { accountId: json.accountId, shard: json.shard };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "네트워크 오류가 발생했습니다.";
      setFetchError(msg);
    } finally {
      setSeasonLoading(false);
    }
  }, [playerName, playerData]);

  useEffect(() => {
    const handler = (e: Event) => {
      const name = (e as CustomEvent<string>).detail;
      if (name) handleSearch(name);
    };
    window.addEventListener("gamecode:search", handler);
    return () => window.removeEventListener("gamecode:search", handler);
  }, [handleSearch]);

  // Auto-search from leaderboard link (?q=PlayerName)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) {
      window.history.replaceState({}, "", "/");
      handleSearch(q);
    }
  }, [handleSearch]);

  const handleReset = useCallback(() => {
    setPhase("landing");
    setPlayerName("");
    setPlayerData(null);
    setFetchError(null);
    setMatches([]);
    accountRef.current = null;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <main className="bg-[#090f1e] min-h-screen overflow-x-hidden">
      <Navbar onReset={handleReset} />

      {phase === "scanning" && (
        <AnalysisOverlay
          playerName={playerName}
          onComplete={handleAnalysisComplete}
        />
      )}

      {phase === "result" ? (
        <>
          <ResultSection
            playerName={playerName}
            playerData={playerData}
            fetchError={fetchError}
            seasonLoading={seasonLoading}
            matches={matches}
            matchesLoading={matchesLoading}
            onReset={handleReset}
            onSeasonChange={handleSeasonChange}
            onModeChange={handleModeChange}
          />
          <div className="flex flex-col items-center gap-4 py-20 border-t border-white/5">
            <p className="text-[10px] font-mono text-cyan-400/40 tracking-[0.3em] uppercase">
              PERSONA ATLAS
            </p>
            <p className="text-slate-400 text-sm font-mono text-center">
              AI가 분류한 16개의 전투 유형 — 당신은 어디에 속하나요?
            </p>
            <a
              href="/personas"
              className="mt-2 px-8 py-3 border border-cyan-500/30 text-cyan-400 font-mono text-xs tracking-[0.2em] hover:bg-cyan-500/10 transition-colors"
            >
              전체 페르소나 보기 →
            </a>
          </div>
          <Footer onReset={handleReset} />
        </>
      ) : (
        <>
          <HeroSection onSearch={handleSearch} />
          <div className="flex flex-col items-center gap-4 py-20 border-t border-white/5">
            <p className="text-[10px] font-mono text-cyan-400/40 tracking-[0.3em] uppercase">
              PERSONA ATLAS
            </p>
            <p className="text-slate-400 text-sm font-mono text-center">
              AI가 분류한 16개의 전투 유형 — 당신은 어디에 속하나요?
            </p>
            <a
              href="/personas"
              className="mt-2 px-8 py-3 border border-cyan-500/30 text-cyan-400 font-mono text-xs tracking-[0.2em] hover:bg-cyan-500/10 transition-colors"
            >
              전체 페르소나 보기 →
            </a>
          </div>
          <HowItWorks />
          <AICoachingPreview />
          <RadarChartSection />
          <Footer onReset={handleReset} />
        </>
      )}
    </main>
  );
}
