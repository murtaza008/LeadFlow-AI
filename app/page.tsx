import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { FeatureCards } from "@/components/landing/FeatureCards";
import { BeforeAfter } from "@/components/landing/BeforeAfter";
import { SocialProof } from "@/components/landing/SocialProof";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-leaf text-foreground">
      <Nav />
      <Hero />
      <FeatureCards />
      <BeforeAfter />
      <SocialProof />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
