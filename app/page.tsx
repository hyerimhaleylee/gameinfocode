"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import PersonaCards from "@/components/PersonaCards";
import HowItWorks from "@/components/HowItWorks";
import AICoachingPreview from "@/components/AICoachingPreview";
import RadarChartSection from "@/components/RadarChartSection";
import Footer from "@/components/Footer";
import AnalysisOverlay from "@/components/AnalysisOverlay";
import ResultSection from "@/components/ResultSection";
import type { PlayerApiResponse } from "@/lib/persona";

type Phase = "landing" | "scanning" | "result";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("landing");
  const [playerName, setPlayerName] = useState("");
  const [playerData, setPlayerData] = useState<PlayerApiResponse | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [seasonLoading, setSeasonLoading] = useState(false);
  const [teammates, setTeammates] = useState<PlayerApiResponse["teammates"]>([]);
  const [teammatesLoading, setTeammatesLoading] = useState(false);

  const accountRef = useRef<{ accountId: string; shard: string } | null>(null);
  const fetchPromiseRef = useRef<Promise<PlayerApiResponse | null>>(Promise.resolve(null));

  const buildUrl = (name: string, opts?: { season?: string; accountId?: string; shard?: string }) => {
    const params = new URLSearchParams({ name });
    if (opts?.season) params.set("season", opts.season);
    if (opts?.accountId) params.set("accountId", opts.accountId);
    if (opts?.shard) params.set("shard", opts.shard);
    return `/api/player?${params}`;
  };

  const fetchTeammates = useCallback(async (accountId: string, shard: string) => {
    setTeammatesLoading(true);
    try {
      const res = await fetch(`/api/teammates?accountId=${encodeURIComponent(accountId)}&shard=${encodeURIComponent(shard)}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setTeammates(data);
      }
    } catch {
      // non-critical
    } finally {
      setTeammatesLoading(false);
    }
  }, []);

  const handleSearch = useCallback((name: string) => {
    setPlayerName(name);
    setPhase("scanning");
    setPlayerData(null);
    setFetchError(null);
    setTeammates([]);
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
      // Fetch teammates separately (non-blocking, appears after main result)
      fetchTeammates(data.accountId, data.shard);
    }
    setPhase("result");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [fetchTeammates]);

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
      });
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "분석 중 오류가 발생했습니다.");
      setPlayerData(json as PlayerApiResponse);
      accountRef.current = { accountId: json.accountId, shard: json.shard };
      // teammates persist from previous fetch — no need to re-fetch
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "네트워크 오류가 발생했습니다.";
      setFetchError(msg);
    } finally {
      setSeasonLoading(false);
    }
  }, [playerName]);

  useEffect(() => {
    const handler = (e: Event) => {
      const name = (e as CustomEvent<string>).detail;
      if (name) handleSearch(name);
    };
    window.addEventListener("gamecode:search", handler);
    return () => window.removeEventListener("gamecode:search", handler);
  }, [handleSearch]);

  const handleReset = useCallback(() => {
    setPhase("landing");
    setPlayerName("");
    setPlayerData(null);
    setFetchError(null);
    setTeammates([]);
    accountRef.current = null;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <main className="bg-[#080d1a] min-h-screen overflow-x-hidden">
      <Navbar />

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
            teammates={teammates}
            teammatesLoading={teammatesLoading}
            onReset={handleReset}
            onSeasonChange={handleSeasonChange}
          />
          <PersonaCards />
          <Footer />
        </>
      ) : (
        <>
          <HeroSection onSearch={handleSearch} />
          <PersonaCards />
          <HowItWorks />
          <AICoachingPreview />
          <RadarChartSection />
          <Footer />
        </>
      )}
    </main>
  );
}
