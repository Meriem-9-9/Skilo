import { Navbar }            from '@/components/layout/Navbar'
import { HeroSection }       from '@/components/landing/HeroSection'
import { HowItWorksSection } from '@/components/landing/HowItWorksSection'
import { FeaturesSection }   from '@/components/landing/FeaturesSection'
import { StatsSection }      from '@/components/landing/StatsSection'
import { CtaSection }        from '@/components/landing/CtaSection'
import { Footer }            from '@/components/landing/Footer'

/**
 * Landing page — app/page.tsx
 *
 * Ce fichier ne contient aucune logique ni aucun style.
 * Il orchestre simplement les sections dans leur ordre naturel.
 * Pour modifier une section → aller dans components/landing/<NomSection>.tsx
 */
export default function LandingPage() {
  return (
    <div>
      <Navbar />
      <HeroSection />
      <HowItWorksSection />
      <FeaturesSection />
       <StatsSection />
      <CtaSection />
      <Footer />
    </div>
  )
}
