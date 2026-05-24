import Navbar from "@/components/Navbar";
import PersonaCards from "@/components/PersonaCards";
import Footer from "@/components/Footer";

export const metadata = { title: "전투 페르소나 — GameInfoCode" };

export default function PersonasPage() {
  return (
    <main className="bg-[#090f1e] min-h-screen overflow-x-hidden">
      <Navbar />
      <div className="pt-24 pb-8 text-center">
        <p className="text-[10px] font-mono text-cyan-400/50 tracking-[0.3em] uppercase mb-3">
          COMBAT PERSONA ATLAS
        </p>
        <h1 className="text-3xl font-bold text-white">16개 전투 페르소나</h1>
        <p className="text-slate-500 font-mono text-sm mt-2">
          AI가 분류한 배틀그라운드 플레이어 유형
        </p>
      </div>
      <PersonaCards />
      <Footer />
    </main>
  );
}
