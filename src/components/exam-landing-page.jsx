"use client"

import Link from "next/link"
import { ArrowRight, Check, LogIn } from "lucide-react"
import { LoginDialog } from "@/components/login-dialog"
import { EXAM_LANDING_PAGES } from "@/components/exam-landing-data"
import { MascotOwl } from "@/components/mascot-owl"

export function ExamLandingPage({ exam }) {
  const page = EXAM_LANDING_PAGES[exam]
  if (!page) return null

  const registerHref = `/register?exam=${exam}`

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-[#252641]" style={{ "--exam-accent": page.accent, "--exam-soft": page.soft }}>
      <header className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-6 lg:px-10">
        <Link href="/" className="flex items-center gap-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--exam-accent)] focus-visible:ring-offset-4" aria-label="CSE Review System home">
          <MascotOwl size={50} trigger="loop" className="transition-transform duration-300 group-hover:scale-105" />
          <span className="text-sm font-black tracking-tight text-[#113c49]">CSE Review System</span>
        </Link>
        <div className="flex items-center gap-3">
          <LoginDialog><button type="button" className="inline-flex h-10 items-center gap-2 rounded-full border border-[#d9d9e6] bg-white px-4 text-sm font-semibold text-[#2f327d] transition-colors hover:border-[var(--exam-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--exam-accent)] focus-visible:ring-offset-2"><LogIn className="h-4 w-4" />Log in</button></LoginDialog>
          <Link href={registerHref} className="inline-flex h-10 items-center rounded-full bg-[var(--exam-accent)] px-5 text-sm font-bold text-white shadow-[0_10px_24px_color-mix(in_srgb,var(--exam-accent)_26%,transparent)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--exam-accent)] focus-visible:ring-offset-2">Register</Link>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-[var(--exam-soft)] px-6 pb-20 pt-12 lg:px-10 lg:pb-28 lg:pt-20">
          <div className="mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-[1fr_.9fr]">
            <div>
              <h1 className="max-w-2xl text-4xl font-extrabold leading-[1.08] tracking-[-0.035em] text-[#2f327d] sm:text-5xl lg:text-6xl">{page.headline}</h1>
              <p className="mt-7 max-w-xl text-base leading-7 text-[#464646] sm:text-lg">{page.summary}</p>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link href={registerHref} className="inline-flex h-12 items-center gap-2 rounded-full bg-[var(--exam-accent)] px-6 text-sm font-bold text-white shadow-[0_12px_28px_color-mix(in_srgb,var(--exam-accent)_30%,transparent)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--exam-accent)] focus-visible:ring-offset-4">Register for {page.label} <ArrowRight className="h-4 w-4" /></Link>
                <a href="#review-path" className="text-sm font-semibold text-[#2f327d] underline decoration-[var(--exam-accent)] decoration-2 underline-offset-8 hover:text-[var(--exam-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--exam-accent)] focus-visible:ring-offset-4">Explore your review path</a>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-[500px]">
              <div className="absolute inset-x-8 bottom-5 top-10 rounded-[28px] bg-white/70" />
              <img src={page.image} alt={page.imageAlt} className="relative z-10 h-[360px] w-full rounded-[24px] object-cover shadow-[0_24px_60px_rgba(38,45,118,.18)] sm:h-[440px]" />
              <div className="absolute -bottom-4 left-5 z-20 max-w-[220px] rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#2f327d] shadow-[0_12px_28px_rgba(38,45,118,.16)]">A focused home for your {page.label} review.</div>
            </div>
          </div>
        </section>

        <section id="review-path" className="scroll-mt-8 px-6 py-20 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-[1200px]">
            <h2 className="max-w-2xl text-3xl font-bold leading-tight tracking-[-0.03em] text-[#2f327d] sm:text-4xl">A review process that stays connected from lesson to practice.</h2>
            <div className="mt-12 grid gap-8 border-y border-[#e3e4ed] py-8 md:grid-cols-3">
              {page.focus.map((item) => <div key={item} className="flex gap-3"><span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--exam-soft)] text-[var(--exam-accent)]"><Check className="h-4 w-4" /></span><p className="text-base font-semibold leading-7 text-[#2f327d]">{item}</p></div>)}
            </div>
          </div>
        </section>

        <section className="bg-[#252641] px-6 py-20 text-white lg:px-10 lg:py-24">
          <div className="mx-auto flex max-w-[1000px] flex-col items-start justify-between gap-8 md:flex-row md:items-end">
            <div><h2 className="max-w-2xl text-3xl font-bold leading-tight tracking-[-0.03em] sm:text-4xl">Start building your {page.label} review plan today.</h2><p className="mt-4 max-w-xl text-sm leading-7 text-[#d7d8e6]">Register once, then complete your application through the shared CSE Review System registration process.</p></div>
            <Link href={registerHref} className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-[#2f327d] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#252641]">Register for {page.label} <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </section>
      </main>
    </div>
  )
}
