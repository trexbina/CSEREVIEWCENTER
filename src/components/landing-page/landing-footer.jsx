"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export function LandingFooter() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()
    if (!email.trim()) return
    setSubmitted(true)
  }

  return (
    <footer className="bg-[#252641] px-6 py-16 text-white lg:px-10 lg:py-20">
      <div className="mx-auto max-w-[900px] text-center">
        <div className="flex items-center justify-center gap-5">
          <span className="flex h-12 w-12 rotate-45 items-center justify-center rounded-sm bg-[#49c8f0]"><span className="-rotate-45 text-[10px] font-black text-[#113c49]">CSE</span></span>
          <span className="border-l border-white/50 pl-5 text-left text-sm font-semibold">Virtual review<br />for Civil Service</span>
        </div>
        <h2 className="mt-14 text-lg font-medium text-[#b2b3cf]">Subscribe to get our Newsletter</h2>
        <form onSubmit={handleSubmit} className="mx-auto mt-7 flex max-w-[580px] rounded-full border border-[#83839a] p-1.5">
          <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Your Email" className="min-w-0 flex-1 rounded-full bg-transparent px-5 text-sm text-white outline-none placeholder:text-[#83839a]" />
          <Button type="submit" className="rounded-full bg-[#545ae8] px-7 text-sm text-white hover:bg-[#454bd1]">{submitted ? "Subscribed" : "Subscribe"}</Button>
        </form>
        <div className="mt-14 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-[#b2b3cf]">
          <a href="#features" className="hover:text-white">Features</a><span className="text-[#83839a]">|</span><a href="/pre-register" className="hover:text-white">Pre-register</a><span className="text-[#83839a]">|</span><a href="#about" className="hover:text-white">About Us</a>
        </div>
        <p className="mt-12 text-sm text-[#b2b3cf]">© 2026 CSE Review System</p>
      </div>
    </footer>
  )
}
