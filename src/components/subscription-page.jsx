"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowRight, BookOpen, ChartNoAxesCombined, ClipboardCheck } from "lucide-react"
import { LoginDialog } from "@/components/login-dialog"
import { Button } from "@/components/ui/button"
import { MascotOwl } from "@/components/mascot-owl"

const FALLBACK_PLANS = [
  { name: "Monthly", price: "199", description: "Flexible review access for one calendar month.", note: "For short, concentrated preparation." },
  { name: "Annual", price: "1,999", description: "Full-year review access for a longer preparation runway.", note: "For long-term review and revision." },
]

const ACCESS = [
  { title: "Learn", description: "Organized review materials and assigned modules in one place.", Icon: BookOpen },
  { title: "Practice", description: "Quizzes and mock exams that support your review routine.", Icon: ClipboardCheck },
  { title: "Review progress", description: "A clearer view of scores and progress as you prepare.", Icon: ChartNoAxesCombined },
]

export function SubscriptionPage() {
  const [plans, setPlans] = useState(FALLBACK_PLANS)
  useEffect(() => {
    fetch("/api/public/subscription-plans").then((response) => response.json()).then((data) => {
      if (Array.isArray(data.plans) && data.plans.length) {
        setPlans(data.plans.map((plan) => ({
          name: plan.name,
          price: Number(plan.price || 0).toLocaleString("en-PH"),
          description: plan.description || `Access for ${plan.examination_name}.`,
          note: `${plan.billing_interval === "annual" ? "Annual" : "Monthly"} review access for ${plan.examination_name}`,
        })))
      }
    }).catch(() => {})
  }, [])
  return (
    <main className="min-h-screen bg-[#fffaf5] text-[#252641]">
      <header className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-5 py-5 sm:px-6 sm:py-7 lg:px-10">
        <Link href="/" className="group flex items-center gap-2.5 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#49c8f0] focus-visible:ring-offset-4" aria-label="CSE Review System home">
          <MascotOwl size={44} trigger="loop" className="transition-transform duration-300 group-hover:scale-105 sm:h-[50px] sm:w-[50px]" />
          <span className="hidden text-base font-black tracking-tight text-[#113c49] sm:inline">CSE Review System</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm lg:flex">
          <Link href="/" className="transition-colors hover:text-[#f48c06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#49c8f0] focus-visible:ring-offset-4">Home</Link>
          <Link href="/#programs" className="transition-colors hover:text-[#f48c06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#49c8f0] focus-visible:ring-offset-4">Programs</Link>
          <Link href="/#features" className="transition-colors hover:text-[#f48c06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#49c8f0] focus-visible:ring-offset-4">Features</Link>
          <Link href="/subscriptions" className="font-semibold text-[#f48c06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#49c8f0] focus-visible:ring-offset-4">Subscriptions</Link>
        </nav>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <LoginDialog><Button className="h-10 rounded-full bg-white px-4 text-sm font-medium text-[#6c6c6c] shadow-[0_10px_24px_rgba(0,0,0,.05)] hover:bg-white sm:px-6">Log in</Button></LoginDialog>
          <Link href="/register"><Button className="h-10 rounded-full bg-[#f48c06] px-5 text-sm font-medium text-white hover:bg-[#dc7900] sm:px-6">Register</Button></Link>
        </div>
      </header>

      <section className="px-6 pb-20 pt-12 lg:px-10 lg:pb-28 lg:pt-20">
        <div className="mx-auto max-w-[1100px]">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-extrabold leading-[1.08] tracking-[-0.035em] text-[#2f327d] sm:text-6xl">Review access that fits your timeline.</h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#5f607b] sm:text-lg">Choose the access period that matches your preparation schedule. Every plan uses the same registration process and connects to your assigned review program.</p>
          </div>

          <div className="mt-14 grid border-y border-[#eadfd4] md:grid-cols-3">
            {plans.map((plan, index) => (
              <article key={plan.name} className={`flex flex-col py-9 ${index ? "md:border-l md:border-[#eadfd4] md:pl-9" : "md:pr-9"} ${index < plans.length - 1 ? "border-b border-[#eadfd4] md:border-b-0" : ""}`}>
                <h2 className="text-2xl font-bold tracking-[-0.02em] text-[#2f327d]">{plan.name}</h2>
                <p className="mt-3 max-w-[28ch] text-sm leading-6 text-[#62637c]">{plan.description}</p>
                <div className="mt-9 flex items-baseline gap-2"><span className="text-5xl font-extrabold tracking-[-0.04em] text-[#252641]">₱{plan.price}</span><span className="text-sm text-[#62637c]">total access</span></div>
                <p className="mt-3 text-sm font-semibold text-[#2f327d]">{plan.note}</p>
                <Link href="/register" className="mt-8 inline-flex w-fit items-center gap-2 text-sm font-bold text-[#d97800] underline decoration-[#d97800] decoration-2 underline-offset-8 transition-colors hover:text-[#9f5600] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f48c06] focus-visible:ring-offset-4">Register for this plan <ArrowRight className="h-4 w-4" /></Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#eadfd4] bg-white px-6 py-20 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-[1100px]">
          <h2 className="max-w-xl text-3xl font-bold leading-tight tracking-[-0.03em] text-[#2f327d] sm:text-4xl">The essentials stay the same—your pace is what changes.</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {ACCESS.map(({ title, description, Icon }) => <div key={title} className="border-t-2 border-[#f48c06] pt-5"><Icon className="h-5 w-5 text-[#f48c06]" /><h3 className="mt-5 text-lg font-bold text-[#2f327d]">{title}</h3><p className="mt-3 max-w-[30ch] text-sm leading-6 text-[#62637c]">{description}</p></div>)}
          </div>
        </div>
      </section>

      <section className="bg-[#252641] px-6 py-16 text-white lg:px-10 lg:py-20">
        <div className="mx-auto flex max-w-[1100px] flex-col items-start justify-between gap-7 md:flex-row md:items-end">
          <div><h2 className="max-w-xl text-3xl font-bold leading-tight tracking-[-0.03em] sm:text-4xl">Ready to make your review schedule concrete?</h2><p className="mt-4 max-w-xl text-sm leading-7 text-[#d7d8e6]">Start your registration, select your review program, and let the administration guide the next step.</p></div>
          <Link href="/register"><Button className="h-12 rounded-full bg-[#f48c06] px-7 text-white hover:bg-[#dc7900]">Register now</Button></Link>
        </div>
      </section>

      <footer className="border-t border-[#373954] bg-[#252641] px-6 py-6 text-center text-xs text-[#b2b3cf]">© 2026 CSE Review System · <Link href="/" className="underline underline-offset-4 hover:text-white">Back to home</Link></footer>
    </main>
  )
}
