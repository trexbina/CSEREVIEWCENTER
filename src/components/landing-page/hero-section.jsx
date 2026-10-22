"use client"

import { useState, useRef, useEffect } from "react"
import { LoginDialog, ForgotPasswordDialog } from "@/components/login-dialog"
import { Button } from "@/components/ui/button"
import { Phone, Mail, MapPin, X, BookOpen, CheckCircle, Award } from "lucide-react"

export function HeroSection() {
  const [contactOpen, setContactOpen] = useState(false)
  const contactRef = useRef(null)

  // Close contact dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (contactRef.current && !contactRef.current.contains(event.target)) {
        setContactOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <section className="relative w-full bg-slate-900 text-slate-100 flex flex-col justify-between min-h-[92vh] overflow-hidden">
      {/* Subtle modern background gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/30 via-slate-900 to-slate-950 pointer-events-none" />

      {/* Floating Modern Header */}
      <header className="relative z-20 mt-6 sm:mt-10 w-full max-w-5xl mx-auto px-4 sm:px-6">
        <div className="mx-auto flex h-16 items-center justify-between rounded-full bg-slate-800/80 backdrop-blur-md px-5 sm:px-8 border border-slate-700/60 shadow-lg">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-sm">
              CSE
            </div>
            <span className="text-sm sm:text-base font-semibold tracking-wide text-slate-100">
              CSE Review System
            </span>
          </div>

          {/* Navigation Links & Buttons */}
          <div className="flex items-center gap-4 sm:gap-6">
            <nav className="hidden sm:flex items-center gap-5 text-xs sm:text-sm text-slate-300">
              {/* Contact Us dropdown */}
              <div className="relative" ref={contactRef}>
                <button
                  type="button"
                  onClick={() => setContactOpen((prev) => !prev)}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Contact Us
                </button>

                {contactOpen && (
                  <div className="absolute top-full mt-3 right-0 w-72 bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-xl z-50 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                      <span className="text-xs font-semibold text-slate-300 uppercase">Contact Us</span>
                      <button onClick={() => setContactOpen(false)} className="text-slate-400 hover:text-white">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="py-2.5 space-y-2 text-xs text-slate-300">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-amber-400 shrink-0" />
                        <span>support@reviewerexam.com</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-amber-400 shrink-0" />
                        <span>+63 900 000 0000</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                        <span>Civil Service Review Center, Philippines</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <a href="#features" className="hover:text-white transition-colors">
                Features
              </a>

              <a href="/pre-register" className="hover:text-white transition-colors">
                Pre-Register
              </a>

              <ForgotPasswordDialog>
                <button type="button" className="hover:text-white transition-colors cursor-pointer">
                  Forgot Password?
                </button>
              </ForgotPasswordDialog>
            </nav>

            {/* Login Action Button */}
            <LoginDialog>
              <Button className="rounded-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold h-9 px-5 text-xs sm:text-sm cursor-pointer shadow-sm">
                Log In
              </Button>
            </LoginDialog>
          </div>
        </div>
      </header>

      {/* Hero Content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center my-auto flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium mb-6">
          <Award className="h-3.5 w-3.5" />
          <span>Civil Service Examination Review Portal</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Master the Civil Service Examination
        </h1>

        <p className="mt-5 text-sm sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
          Comprehensive review modules, mock examinations, timed practice sets, and live progress analytics designed to help you pass with flying colors.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <LoginDialog>
            <Button className="rounded-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold h-11 px-7 text-sm cursor-pointer shadow-md">
              Access Student Portal
            </Button>
          </LoginDialog>
          
          <a href="/pre-register">
            <Button variant="outline" className="rounded-full border-slate-700 hover:bg-slate-800 text-slate-200 font-medium h-11 px-7 text-sm cursor-pointer">
              Pre-Register Online
            </Button>
          </a>
        </div>

        {/* Feature Highlights Badges */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl text-left">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex items-start gap-3">
            <BookOpen className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-semibold text-slate-200">Structured Curriculum</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Professional & Sub-Professional content tracks</p>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-semibold text-slate-200">Simulated Mock Exams</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Real-time timers and instant score breakdowns</p>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex items-start gap-3">
            <Award className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-semibold text-slate-200">Analytical Progress</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Track mastery across all exam competencies</p>
            </div>
          </div>
        </div>
      </div>

      <div className="h-8" />
    </section>
  )
}
