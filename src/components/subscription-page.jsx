"use client"

import { Check, ChevronDown, Mail, MapPin, Phone, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { LoginDialog } from "@/components/login-dialog"
import { Button } from "@/components/ui/button"

const PLANS = [
  {
    name: "1 Month",
    originalPrice: "299",
    price: "199",
    description: "A focused month of complete exam preparation.",
  },
  {
    name: "3 Months",
    originalPrice: "599",
    price: "399",
    description: "The most popular plan for a consistent review routine.",
    popular: true,
  },
  {
    name: "6 Months",
    originalPrice: "999",
    price: "699",
    description: "Long-term access for steady preparation and mastery.",
  },
]

const BENEFITS = [
  "Access to all review modules",
  "Daily mock test updates",
  "Daily quiz updates",
  "Full access to progression insights",
  "Performance tracking and score breakdowns",
  "Practice materials and learning resources",
]

export function SubscriptionPage() {
  const [contactOpen, setContactOpen] = useState(false)
  const contactRef = useRef(null)

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (contactRef.current && !contactRef.current.contains(event.target)) setContactOpen(false)
    }
    document.addEventListener("mousedown", closeOnOutsideClick)
    return () => document.removeEventListener("mousedown", closeOnOutsideClick)
  }, [])

  return (
    <main className="min-h-screen bg-[#fffaf5] text-[#252641]">
      <header className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-7 lg:px-10">
        <Link href="/" className="flex items-center gap-2" aria-label="CSE Review System home">
          <span className="flex h-10 w-10 rotate-45 items-center justify-center rounded-sm bg-[#49c8f0]">
            <span className="-rotate-45 text-[9px] font-black text-[#113c49]">CSE</span>
          </span>
          <span className="text-base font-black tracking-tight text-[#113c49]">CSE Review System</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm lg:flex">
          <Link href="/" className="hover:text-[#f48c06]">Home</Link>
          <Link href="/#about" className="hover:text-[#f48c06]">About Us</Link>
          <Link href="/#features" className="hover:text-[#f48c06]">Features</Link>
          <Link href="/subscriptions" className="font-semibold text-[#f48c06]">Subscriptions</Link>
          <div className="relative" ref={contactRef}>
            <button type="button" onClick={() => setContactOpen((open) => !open)} className="inline-flex items-center gap-1 hover:text-[#f48c06]">
              Contact <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {contactOpen && (
              <div className="absolute right-0 top-full z-30 mt-3 w-72 rounded-2xl border border-[#f4d8bd] bg-white p-4 text-xs text-[#696984] shadow-xl">
                <div className="mb-3 flex items-center justify-between border-b border-[#f4d8bd] pb-2 font-bold text-[#252641]">
                  Contact us
                  <button type="button" onClick={() => setContactOpen(false)} aria-label="Close contact details"><X className="h-4 w-4" /></button>
                </div>
                <div className="space-y-2.5">
                  <div className="flex gap-2"><Mail className="h-4 w-4 text-[#f48c06]" /> support@reviewerexam.com</div>
                  <div className="flex gap-2"><Phone className="h-4 w-4 text-[#f48c06]" /> +63 900 000 0000</div>
                  <div className="flex gap-2"><MapPin className="h-4 w-4 shrink-0 text-[#f48c06]" /> Civil Service Review Center, Philippines</div>
                </div>
              </div>
            )}
          </div>
        </nav>
        <div className="flex items-center gap-3">
          <LoginDialog><Button className="h-10 rounded-full bg-white px-6 text-sm font-medium text-[#6c6c6c] shadow-[0_10px_24px_rgba(0,0,0,.05)] hover:bg-white">Log in</Button></LoginDialog>
          <Link href="/pre-register"><Button className="h-10 rounded-full bg-[#f48c06] px-6 text-sm font-medium text-white hover:bg-[#dc7900]">Sign up</Button></Link>
        </div>
      </header>

      <section className="px-6 pb-20 pt-14 lg:px-10 lg:pb-28 lg:pt-20">
        <div className="mx-auto max-w-[1100px] text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#f48c06]">Simple, complete access</p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-[#2f327d] sm:text-6xl">Choose your review plan.</h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[#696984]">
            Get everything you need to prepare for the Civil Service Examination, from structured modules to daily practice and complete progress insights.
          </p>
          <div className="mx-auto mt-7 inline-flex items-center rounded-full bg-[#fff0dc] px-5 py-2 text-sm font-bold text-[#d97800]">
            Limited time offer!
          </div>

          <div className="mt-14 grid gap-6 text-left md:grid-cols-3">
            {PLANS.map((plan) => (
              <article key={plan.name} className={`relative flex flex-col rounded-[24px] border bg-white p-7 shadow-[0_10px_45px_rgba(38,45,118,.08)] ${plan.popular ? "border-[#f48c06] ring-2 ring-[#f48c06]/15" : "border-[#f3e6d8]"}`}>
                {plan.popular && <span className="absolute right-6 top-6 rounded-full bg-[#fff0dc] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#f48c06]">Most popular</span>}
                <h2 className="text-xl font-bold text-[#2f327d]">{plan.name}</h2>
                <p className="mt-3 min-h-12 text-sm leading-6 text-[#696984]">{plan.description}</p>
                <div className="mt-6 flex flex-wrap items-end gap-x-2 gap-y-1">
                  <span className="text-lg font-semibold text-[#9696a6] line-through">₱{plan.originalPrice}</span>
                  <span className="text-5xl font-extrabold text-[#252641]">₱{plan.price}</span>
                  <span className="pb-2 text-sm text-[#696984]">/ plan</span>
                </div>
                <Link href="/pre-register" className="mt-7">
                  <Button className={`h-12 w-full rounded-full font-semibold ${plan.popular ? "bg-[#f48c06] text-white hover:bg-[#dc7900]" : "bg-[#fff0dc] text-[#d97800] hover:bg-[#ffe4bd]"}`}>
                    Get started
                  </Button>
                </Link>
                <div className="mt-7 border-t border-[#f3e6d8] pt-6">
                  <p className="mb-4 text-xs font-bold uppercase tracking-wider text-[#252641]">Included in every plan</p>
                  <ul className="space-y-3">
                    {BENEFITS.map((benefit) => <li key={benefit} className="flex gap-2 text-sm text-[#696984]"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#35b98a]" />{benefit}</li>)}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#252641] px-6 py-16 text-center text-white lg:px-10">
        <h2 className="text-2xl font-bold sm:text-3xl">One subscription. Full preparation.</h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[#b2b3cf]">Stay ready with updated practice content, comprehensive modules, and the insights you need to improve every day.</p>
        <Link href="/pre-register"><Button className="mt-7 rounded-full bg-[#f48c06] px-7 text-white hover:bg-[#dc7900]">Start your review journey</Button></Link>
      </section>

      <footer className="border-t border-[#e9dfd5] bg-white px-6 py-6 text-center text-xs text-[#696984]">
        © 2026 CSE Review System · <Link href="/" className="hover:text-[#f48c06]">Back to home</Link>
      </footer>
    </main>
  )
}
