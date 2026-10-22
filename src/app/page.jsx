import { HeroSection, AboutSystemSection, AboutUsSection, ProgramsSection, LandingFooter } from "@/components/landing-page"

export const metadata = {
  title: "CSE Review System | Civil Service Examination Platform",
  description: "Comprehensive Civil Service Examination review and prep platform with modern learning tools for students and reviewers.",
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground overflow-x-hidden selection:bg-primary/30">
      <main className="flex-1 relative z-10 flex flex-col w-full">
        <HeroSection />
        <AboutSystemSection />
        <AboutUsSection />
        <ProgramsSection />
      </main>
      <LandingFooter />
    </div>
  )
}
