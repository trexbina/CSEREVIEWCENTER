import { HeroSection, AboutSystemSection, AboutUsSection, ProgramsSection, LandingFooter } from "@/components/landing-page"

export const metadata = {
  title: "Reviewer Exam - RE | Global Examination Review Platform",
  description: "Prepare for examinations worldwide with learning tools from Owl Review Center.",
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground overflow-x-hidden selection:bg-primary/30">
      <main className="flex-1 relative z-10 flex flex-col w-full">
        <HeroSection />
        <AboutSystemSection />
      </main>
      <LandingFooter />
    </div>
  )
}
