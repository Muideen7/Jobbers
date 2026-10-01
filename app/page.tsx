import { LandingNavbar } from "@/components/homepage/LandingNavbar";
import { Hero } from "@/components/homepage/Hero";
import { TopCompanies } from "@/components/homepage/TopCompanies";
import { AiMatcher } from "@/components/homepage/AiMatcher";
import { HowItWorks } from "@/components/homepage/HowItWorks";
import { LiveOpportunities } from "@/components/homepage/LiveOpportunities";
import { WallOfLove } from "@/components/homepage/WallOfLove";
import { Faq } from "@/components/homepage/Faq";
import { LandingFooter } from "@/components/homepage/LandingFooter";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface">
      <LandingNavbar />

      <main>
        <Hero />
        <TopCompanies />
        <AiMatcher />
        <HowItWorks />
        <LiveOpportunities />
        <WallOfLove />
        <Faq />
      </main>

      <LandingFooter />
    </div>
  );
}
