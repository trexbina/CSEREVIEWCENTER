import Link from "next/link"
import { ThemeSwitcher } from "@/components/theme-switcher"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <h1 className="text-xl font-bold">ReviewApp</h1>
          <ThemeSwitcher />
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-16">
        <div className="text-center">
          <h2 className="text-4xl font-bold tracking-tight">
            Welcome to ReviewApp
          </h2>
          <p className="mt-4 max-w-lg text-lg text-muted-foreground">
            A student and teacher review system. Switch themes above to see how the entire UI adapts instantly — no component rewrites needed.
          </p>
        </div>

        {/* Theme Demo Cards */}
        <div className="grid w-full max-w-3xl gap-6 sm:grid-cols-3">
          {[
            { name: "Modern", desc: "Blue tones, smooth rounded corners, clean aesthetic." },
            { name: "Classic", desc: "Earth tones, sharp square edges, warm feel." },
            { name: "Focus", desc: "High contrast dark mode, green accents, pill shapes." },
          ].map((theme) => (
            <div
              key={theme.name}
              className="rounded-lg border border-border bg-card p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-foreground">{theme.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{theme.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="flex gap-4">
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Sign In
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        Built with Next.js, shadcn/ui & next-themes — All themes powered by CSS variables.
      </footer>
    </div>
  )
}
