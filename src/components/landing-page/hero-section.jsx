"use client"

import { useState, useRef, useEffect } from "react"
import { LoginDialog } from "@/components/login-dialog"
import { Button } from "@/components/ui/button"
import { Phone, Mail, MapPin, X } from "lucide-react"
import { motion } from "framer-motion"

// Dedicated banner carousel slides
// To add or replace photos, just add your files to: /public/banners/
const BANNER_SLIDES = [
  { id: 1, src: "/banners/banner-1.png", alt: "Peak Excellence Graduates" },
  { id: 2, src: "/banners/banner-2.jpg", alt: "Peak Excellence Students" },
  { id: 3, src: "/banners/banner-3.jpg", alt: "Peak Excellence Sessions" },
  { id: 4, src: "/banners/banner-4.jpg", alt: "Peak Excellence Campus" },
]

export function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [contactOpen, setContactOpen] = useState(false)
  const contactRef = useRef(null)

  // Auto-advance banner slides with a relaxed pace (every 10 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % BANNER_SLIDES.length)
    }, 10000)
    return () => clearInterval(timer)
  }, [])

  // Close contact modal when clicking outside
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
    <section className="relative w-full min-h-screen h-screen flex flex-col justify-between overflow-hidden bg-slate-950">
      {/* Background Banner Carousel with Guaranteed Smooth Fade-In */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-slate-950">
        {BANNER_SLIDES.map((slide, index) => {
          const isActive = index === currentSlide
          return (
            <div
              key={slide.id}
              className="absolute inset-0"
              style={{
                opacity: isActive ? 1 : 0,
                zIndex: isActive ? 2 : 1,
                transition: "opacity 1800ms cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              <img
                src={slide.src}
                alt={slide.alt}
                className="h-full w-full object-cover object-center filter brightness-[0.82] saturate-[0.85]"
              />
            </div>
          )
        })}
        {/* Subtle top & bottom cinematic gradients for clean text readability */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/50 via-black/25 to-black/85 pointer-events-none" />
      </div>

      {/* Floating Pill Header */}
      <header className="relative z-20 mt-6 sm:mt-8 md:mt-10 lg:mt-12 w-full max-w-5xl px-4 sm:px-6 mx-auto">
        <div className="mx-auto flex h-15 sm:h-17 items-center justify-between rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 shadow-[0_10px_35px_rgb(0,0,0,0.14)] border border-white/60 dark:border-slate-800/80 ring-1 ring-black/5 transition-all duration-300">
          {/* Logo & Title */}
          <div className="flex items-center gap-3 sm:gap-3.5 pl-1 sm:pl-2">
            <img
              src="/landingpageassets/logo.png"
              alt="Peak Excellence Logo"
              className="h-8 sm:h-9.5 w-auto object-contain drop-shadow-xs"
            />
            <span className="text-sm sm:text-base md:text-lg font-extrabold tracking-wider text-[#475569] dark:text-slate-300 uppercase font-sans">
              PEAK EXCELLENCE CDO
            </span>
          </div>

          {/* Nav & Action Buttons - Equal Spacing */}
          <div className="flex items-center gap-6 sm:gap-7 pr-1">
            <nav className="hidden sm:flex items-center gap-6 sm:gap-7">
              {/* Contact Us button with sliding dropdown modal */}
              <div className="relative" ref={contactRef}>
                <button
                  type="button"
                  onClick={() => setContactOpen((prev) => !prev)}
                  className={`text-xs md:text-sm font-semibold tracking-wide transition-colors duration-300 ease-in-out py-1.5 flex items-center gap-1.5 cursor-pointer outline-none ${contactOpen
                      ? "text-[#0f172a] dark:text-slate-100 font-bold"
                      : "text-[#475569] dark:text-slate-300 hover:text-[#0f172a] dark:hover:text-white"
                    }`}
                >
                  Contact Us
                </button>

                {/* Minimalist Contact Modal */}
                {contactOpen && (
                  <div className="absolute top-full mt-3 right-[-10px] sm:right-0 w-[290px] sm:w-[320px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl p-4 shadow-[0_12px_35px_rgba(0,0,0,0.12)] border border-slate-100/80 dark:border-slate-800 z-50 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-150">
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Contact Info</span>
                      <button
                        onClick={() => setContactOpen(false)}
                        className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="py-3 space-y-2.5 text-xs">
                      <a
                        href="mailto:info@peakexcellence.edu.ph"
                        className="flex items-center gap-2.5 p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors duration-300 group"
                      >
                        <Mail className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#E9C46A] transition-colors duration-300 shrink-0" />
                        <span className="truncate">peakexcellencecdo@gmail.com</span>
                      </a>

                      <div className="flex items-center gap-2.5 p-2 rounded-xl text-slate-600 dark:text-slate-300">
                        <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>+63 917 123 4567</span>
                      </div>

                      <div className="flex items-start gap-2.5 p-2 rounded-xl text-slate-600 dark:text-slate-300">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">3/F GJL Bldg. Julio Pacana St. Licoan, Cagayan de Oro City</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <a
                href="#features"
                className="text-xs md:text-sm font-semibold tracking-wide text-[#475569] dark:text-slate-300 hover:text-[#0f172a] dark:hover:text-white transition-colors duration-300 ease-in-out py-1.5"
              >
                Features
              </a>

              <a
                href="/pre-register"
                className="text-xs md:text-sm font-semibold tracking-wide text-[#475569] dark:text-slate-300 hover:text-[#0f172a] dark:hover:text-white transition-colors duration-300 ease-in-out py-1.5"
              >
                Pre-Register
              </a>
            </nav>

            <LoginDialog>
              <Button className="rounded-full bg-[#E9C46A] text-white font-bold h-8 px-4 text-xs shadow-none border-none transition-opacity duration-300 hover:opacity-85 hover:bg-[#E9C46A] hover:translate-y-0 active:translate-y-0 active:opacity-75 cursor-pointer">
                Log In
              </Button>
            </LoginDialog>
          </div>
        </div>
      </header>

      {/* Hero Content (Left and Right Split) */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 md:pb-20 mt-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-end">
          {/* Left Side: Headline & Tagline */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="lg:col-span-7 flex flex-col text-left items-start"
          >
            <span className="inline-block text-xs sm:text-sm font-bold tracking-widest text-[#E9C46A] uppercase mb-2 drop-shadow-sm">
              Your Journey to Licensure Starts Here
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.35rem] font-sans font-black text-white uppercase tracking-[0.06em] sm:tracking-[0.08em] leading-tight drop-shadow-md">
              THE HIGHEST LEVEL OF <br />
              <span className="text-white drop-shadow-lg text-[#E9C46A]">EXCELLENCE</span>
            </h1>
          </motion.div>

          {/* Right Side: Description, Extra sentence, and Pre-Register Link */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
            className="lg:col-span-5 flex flex-col items-start lg:items-end text-left lg:text-right space-y-5"
          >
            <p className="text-sm sm:text-base md:text-lg text-slate-200/90 font-normal tracking-wide leading-relaxed drop-shadow-sm">
              Empowering future topnotchers with unmatched professionalism, proven review methodologies, and compassionate mentorship. <span className="text-white font-medium">Join thousands of successful board passers and take the first decisive step toward your license today.</span>
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <a
                href="/pre-register"
                className="inline-flex items-center justify-center rounded-full bg-[#E9C46A] text-slate-950 font-bold px-6 sm:px-7 py-3 text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-black/25 hover:bg-[#ebd9a6] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                Pre-Register Now
              </a>
              <a
                href="#about"
                className="inline-flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold px-5 sm:px-6 py-3 text-xs sm:text-sm backdrop-blur-xs border border-white/20 transition-all duration-200"
              >
                Learn More
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

