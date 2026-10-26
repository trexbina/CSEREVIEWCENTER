"use client"

import { useState, useRef, useEffect } from "react"
import { LoginDialog } from "@/components/login-dialog"
import { Button } from "@/components/ui/button"
import { ChevronDown, Mail, MapPin, Phone, Play, X } from "lucide-react"

export function HeroSection() {
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
    <section className="relative overflow-hidden bg-[#fff2e2] text-[#252641]">
      <header className="relative z-20 mx-auto flex max-w-[1200px] items-center justify-between px-6 py-7 lg:px-10">
        <a href="/" className="flex items-center gap-2" aria-label="CSE Review System home">
          <span className="flex h-10 w-10 rotate-45 items-center justify-center rounded-sm bg-[#49c8f0]">
            <span className="-rotate-45 text-[9px] font-black text-[#113c49]">CSE</span>
          </span>
          <span className="text-base font-black tracking-tight text-[#113c49]">CSE Review System</span>
        </a>
        <nav className="hidden items-center gap-8 text-sm text-[#252641] lg:flex">
          <a href="/" className="hover:text-[#f48c06]">Home</a>
          <a href="#about" className="hover:text-[#f48c06]">About Us</a>
          <a href="#features" className="hover:text-[#f48c06]">Features</a>
          <a href="/subscriptions" className="font-semibold text-[#f48c06]">Subscriptions</a>
          <div className="relative" ref={contactRef}>
            <button type="button" onClick={() => setContactOpen((open) => !open)} className="inline-flex items-center gap-1 hover:text-[#f48c06]">
              Contact <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {contactOpen && (
              <div className="absolute right-0 top-full mt-3 w-72 rounded-2xl border border-[#f4d8bd] bg-white p-4 text-xs text-[#696984] shadow-xl">
                <div className="mb-3 flex items-center justify-between border-b border-[#f4d8bd] pb-2 font-bold text-[#252641]">Contact us <button type="button" onClick={() => setContactOpen(false)} aria-label="Close contact details"><X className="h-4 w-4" /></button></div>
                <div className="space-y-2.5"><div className="flex gap-2"><Mail className="h-4 w-4 text-[#f48c06]" /> support@reviewerexam.com</div><div className="flex gap-2"><Phone className="h-4 w-4 text-[#f48c06]" /> +63 900 000 0000</div><div className="flex gap-2"><MapPin className="h-4 w-4 shrink-0 text-[#f48c06]" /> Civil Service Review Center, Philippines</div></div>
              </div>
            )}
          </div>
        </nav>
        <div className="flex items-center gap-3">
          <LoginDialog><Button className="h-10 rounded-full bg-white px-6 text-sm font-medium text-[#6c6c6c] shadow-[0_10px_24px_rgba(0,0,0,.05)] hover:bg-white">Log in</Button></LoginDialog>
          <a href="/pre-register"><Button className="h-10 rounded-full bg-[#f48c06] px-6 text-sm font-medium text-white hover:bg-[#dc7900]">Sign up</Button></a>
        </div>
      </header>

      <div className="relative mx-auto grid max-w-[1200px] items-center gap-8 px-6 pb-24 pt-12 lg:grid-cols-[1fr_1.08fr] lg:px-10 lg:pt-20">
        <div className="relative z-10">
          <h1 className="max-w-xl text-4xl font-extrabold leading-[1.2] text-[#2f327d] sm:text-5xl lg:text-[3.45rem]">
            <span className="text-[#f48c06]">Studying</span> Online is now much easier
          </h1>
          <p className="mt-7 max-w-lg text-base leading-7 text-[#464646]">Build your Civil Service Examination confidence with an interactive platform that makes every lesson, practice set, and progress milestone easier to manage.</p>
          <div className="mt-8 flex items-center gap-5">
            <LoginDialog><Button className="h-12 rounded-full bg-[#f48c06] px-7 font-semibold text-white shadow-lg hover:bg-[#dc7900]">Join for free</Button></LoginDialog>
            <a href="#about" className="group flex items-center gap-3 text-sm text-[#252641]"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#49c8f0] shadow-lg transition-transform group-hover:scale-105"><Play className="ml-0.5 h-4 w-4 fill-current" /></span> See how it works</a>
          </div>
        </div>
        <div className="relative flex min-h-[390px] items-end justify-center">
          <div className="absolute bottom-[-35px] right-0 h-[390px] w-[390px] rounded-full bg-[#ffba7c]/35 blur-sm" />
          <img src="/landingpageassets/figma/design-c17b8-cutout.png" alt="Student carrying study materials" className="relative z-10 max-h-[475px] w-full max-w-[570px] object-contain object-bottom" />
          <div className="absolute left-0 top-20 z-20 rounded-xl bg-white px-4 py-3 text-xs shadow-xl"><span className="block font-bold text-[#252641]">250k</span><span className="text-[#696984]">assisted students</span></div>
          <div className="absolute bottom-16 right-0 z-20 rounded-xl bg-white px-4 py-3 text-xs shadow-xl"><span className="block font-bold text-[#252641]">Congratulations!</span><span className="text-[#696984]">Your admission completed</span></div>
        </div>
      </div>
      <div className="absolute bottom-[-1px] left-[-5%] h-20 w-[110%] rounded-[50%_50%_0_0] bg-white" />
    </section>
  )
}
