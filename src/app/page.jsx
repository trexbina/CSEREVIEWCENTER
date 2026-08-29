import { HeroSection, AboutSystemSection, AboutUsSection, ProgramsSection, LandingFooter } from "@/components/landing-page"

export const metadata = {
  title: "Peak Excellence | Standard Educational Platform",
  description: "Modernizing education with seamless online tools for administrators, teachers, and students.",
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground overflow-x-hidden selection:bg-primary/30 font-[family-name:var(--font-open-sans)]">
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
