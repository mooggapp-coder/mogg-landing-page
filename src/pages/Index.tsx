import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ChadRankSection from "@/components/ChadRankSection";
import FeaturesSection from "@/components/FeaturesSection";
import WaitlistSection from "@/components/WaitlistSection";
import FooterSection from "@/components/FooterSection";

const Index = () => (
  <main className="min-h-screen bg-background">
    <Header />
    <HeroSection />
    <ChadRankSection />
    <div id="features">
      <FeaturesSection />
    </div>
    <div id="waitlist">
      <WaitlistSection />
    </div>
    <FooterSection />
  </main>
);

export default Index;
