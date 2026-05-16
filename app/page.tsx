"use client";

import { useState, useCallback, useRef } from "react";
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

  const fetchPromiseRef = useRef<Promise<PlayerApiResponse | null>>(
    Promise.resolve(null)
  );

  const buildUrl = (name: string, season?: string) => {
    const params = new URLSearchParams({ name, platform: "steam" });
    if (season) params.set("season", season);
    return `/api/player?${params}`;
  };

  const handleSearch = useCallback((name: string) => {
    setPlayerName(name);
    setPhase("scanning");
    setPlayerData(null);
    setFetchError(null);

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
    if (data) setPlayerData(data);
    setPhase("result");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleSeasonChange = useCallback(async (seasonId: string) => {
    if (!playerName) return;
    setSeasonLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(buildUrl(playerName, seasonId));
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "분석 중 오류가 발생했습니다.");
      setPlayerData(json as PlayerApiResponse);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "네트워크 오류가 발생했습니다.";
      setFetchError(msg);
    } finally {
      setSeasonLoading(false);
    }
  }, [playerName]);

  const handleReset = useCallback(() => {
    setPhase("landing");
    setPlayerName("");
    setPlayerData(null);
    setFetchError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <main className="bg-[#050810] min-h-screen overflow-x-hidden">
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
