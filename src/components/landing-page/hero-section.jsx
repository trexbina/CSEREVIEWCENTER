"use client"

import { LoginDialog } from "@/components/login-dialog"
import { Button } from "@/components/ui/button"
import { Play } from "lucide-react"
import { MascotOwl } from "@/components/mascot-owl"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#fff2e2] text-[#252641]">
      <header className="relative z-20 mx-auto flex max-w-[1200px] items-center justify-between px-6 py-7 lg:px-10">
        <a href="/" className="group flex items-center gap-2.5" aria-label="CSE Review System home">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-[#38bdf8] to-[#67e8f9] shadow-sm transition-transform duration-300 group-hover:scale-105">
            <MascotOwl size={36} trigger="loop" className="drop-shadow-sm" />
          </div>
          <span className="text-base font-black tracking-tight text-[#113c49]">CSE Review System</span>
        </a>
        <nav className="hidden items-center gap-8 text-sm text-[#252641] lg:flex">
          <a href="/" className="transition-colors hover:text-[#f48c06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#49c8f0] focus-visible:ring-offset-4">Home</a>
          <a href="#programs" className="transition-colors hover:text-[#f48c06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#49c8f0] focus-visible:ring-offset-4">Programs</a>
          <a href="#features" className="transition-colors hover:text-[#f48c06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#49c8f0] focus-visible:ring-offset-4">Features</a>
          <a href="/subscriptions" className="font-semibold text-[#f48c06] transition-colors hover:text-[#dc7900] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#49c8f0] focus-visible:ring-offset-4">Subscriptions</a>
        </nav>
        <div className="flex items-center gap-3">
          <LoginDialog><Button className="h-10 rounded-full bg-white px-6 text-sm font-medium text-[#6c6c6c] shadow-[0_10px_24px_rgba(0,0,0,.05)] hover:bg-white">Log in</Button></LoginDialog>
          <a href="/register"><Button className="h-10 rounded-full bg-[#f48c06] px-6 text-sm font-medium text-white hover:bg-[#dc7900]">Register</Button></a>
        </div>
      </header>

      <div className="relative mx-auto grid max-w-[1200px] items-center gap-8 px-6 pb-24 pt-12 lg:grid-cols-[1fr_1.08fr] lg:px-10 lg:pt-20">
        <div className="relative z-10">
          <h1 className="max-w-xl text-4xl font-extrabold leading-[1.2] text-[#2f327d] sm:text-5xl lg:text-[3.45rem]">
            One place to <span className="text-[#f48c06]">prepare</span> for what&apos;s next
          </h1>
          <p className="mt-7 max-w-lg text-base leading-7 text-[#464646]">Bring Civil Service, nursing, teaching, and other board-review programs into one focused learning experience—organized lessons, practice, and progress in the same place.</p>
          <div className="mt-8 flex items-center gap-5">
            <LoginDialog><Button className="h-12 rounded-full bg-[#f48c06] px-7 font-semibold text-white shadow-lg hover:bg-[#dc7900]">Enter your portal</Button></LoginDialog>
            <a href="#programs" className="group flex items-center gap-3 rounded-full text-sm text-[#252641] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#49c8f0] focus-visible:ring-offset-4"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#49c8f0] shadow-lg transition-transform group-hover:scale-105"><Play className="ml-0.5 h-4 w-4 fill-current" /></span> Explore programs</a>
          </div>
        </div>
        <div className="relative flex min-h-[390px] items-end justify-center">
          <div className="absolute bottom-[-35px] right-0 h-[390px] w-[390px] rounded-full bg-[#ffba7c]/35 blur-sm" />
          <img src="/landingpageassets/figma/design-c17b8-cutout.png" alt="Student carrying study materials" className="relative z-10 max-h-[475px] w-full max-w-[570px] object-contain object-bottom" />
          <div className="absolute left-0 top-20 z-20 rounded-xl bg-white px-4 py-3 text-xs shadow-xl"><span className="block font-bold text-[#252641]">Multi-exam</span><span className="text-[#696984]">review programs</span></div>
          <div className="absolute bottom-16 right-0 z-20 rounded-xl bg-white px-4 py-3 text-xs shadow-xl"><span className="block font-bold text-[#252641]">Your study plan</span><span className="text-[#696984]">starts here</span></div>
        </div>
      </div>
      <div className="absolute bottom-[-1px] left-[-5%] h-20 w-[110%] rounded-[50%_50%_0_0] bg-white" />
    </section>
  )
}
