import { HeroSection, AboutSystemSection, ProgramsSection, LandingFooter } from "@/components/landing-page"

export const metadata = {
  title: "CSE Review System | Multi-exam Review Platform",
  description: "A unified review platform for Civil Service, nursing, teaching, and other board-exam programs.",
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground overflow-x-hidden selection:bg-primary/30">
      <main className="flex-1 relative z-10 flex flex-col w-full">
        <HeroSection />
        <ProgramsSection />
        <AboutSystemSection />
      </main>
      <LandingFooter />
    </div>
  )
}
