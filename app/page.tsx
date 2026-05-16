"use client";

import { useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import PersonaCards from "@/components/PersonaCards";
import HowItWorks from "@/components/HowItWorks";
import AICoachingPreview from "@/components/AICoachingPreview";
import RadarChartSection from "@/components/RadarChartSection";
import Footer from "@/components/Footer";
import AnalysisOverlay from "@/components/AnalysisOverlay";
import ResultSection from "@/components/ResultSection";

type Phase = "landing" | "scanning" | "result";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("landing");
  const [playerName, setPlayerName] = useState("");

  const handleSearch = useCallback((name: string) => {
    setPlayerName(name);
    setPhase("scanning");
  }, []);

  const handleAnalysisComplete = useCallback(() => {
    setPhase("result");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleReset = useCallback(() => {
    setPhase("landing");
    setPlayerName("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <main className="bg-[#050810] min-h-screen overflow-x-hidden">
      <Navbar />

      {/* Full-screen scanning overlay */}
      {phase === "scanning" && (
        <AnalysisOverlay playerName={playerName} onComplete={handleAnalysisComplete} />
      )}

      {phase === "result" ? (
        <>
          <ResultSection playerName={playerName} onReset={handleReset} />
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
