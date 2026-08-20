import { HeroSection, AboutSystemSection, AboutUsSection, ProgramsSection, LandingFooter } from "@/components/landing-page"
import { SecurityShield } from "@/components/security-shield"

export const metadata = {
  title: "Peak Excellence | Standard Educational Platform",
  description: "Modernizing education with seamless online tools for administrators, teachers, and students.",
}

export default function Home() {
  return (
    <SecurityShield>
      <div className="flex min-h-screen flex-col bg-background text-foreground overflow-x-hidden selection:bg-primary/30">
        <main className="flex-1 relative z-10 flex flex-col w-full">
          <HeroSection />
          <AboutSystemSection />
          <AboutUsSection />
          <ProgramsSection />
        </main>
        <LandingFooter />
      </div>
    </SecurityShield>
  )
}
