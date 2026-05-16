import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import PersonaCards from "@/components/PersonaCards";
import HowItWorks from "@/components/HowItWorks";
import AICoachingPreview from "@/components/AICoachingPreview";
import RadarChartSection from "@/components/RadarChartSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="bg-[#050810] min-h-screen overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <PersonaCards />
      <HowItWorks />
      <AICoachingPreview />
      <RadarChartSection />
      <Footer />
    </main>
  );
}
