import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ArenaDemoSection from "@/components/ArenaDemoSection";
import ChadRankSection from "@/components/ChadRankSection";
import FeaturesSection from "@/components/FeaturesSection";
import WaitlistSection from "@/components/WaitlistSection";
import FooterSection from "@/components/FooterSection";

const Index = () => (
  <main className="min-h-screen bg-background">
    <Header />
    <HeroSection />
    <ArenaDemoSection />
    <ChadRankSection />
    <div id="features">
      <FeaturesSection />
    </div>
    <div id="get-started">
      <WaitlistSection />
    </div>
    <FooterSection />
  </main>
);

export default Index;
