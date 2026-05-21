import Navbar from "@/components/Navbar";
import PersonaCards from "@/components/PersonaCards";
import Footer from "@/components/Footer";

export const metadata = { title: "Personas — GAMECODE" };

export default function PersonaPage() {
  return (
    <main className="bg-[#141a22] min-h-screen overflow-x-hidden">
      <Navbar />
      <div className="pt-24">
        <PersonaCards />
      </div>
      <Footer />
    </main>
  );
}
