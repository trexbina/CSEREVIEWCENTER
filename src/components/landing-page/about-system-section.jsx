"use client"

import { CheckCircle2, Zap, LayoutDashboard, Sparkles } from "lucide-react"
import { motion } from "framer-motion"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
}

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 30,
    scale: 0.96,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
      mass: 0.8,
    },
  },
}

export function AboutSystemSection() {
  return (
    <section id="features" className="py-20 sm:py-24 md:py-28 bg-[#fafafa] relative border-t border-b border-slate-200/70 overflow-hidden">
      {/* Soft ambient gradient aura */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-[#ebd9a6]/20 via-[#dfb550]/10 to-[#ebd9a6]/20 blur-3xl pointer-events-none rounded-full" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-14 sm:mb-20 flex flex-col items-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/60 text-[#b58b2a] text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Platform Highlights</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[#1e293b] mb-3 font-sans">
            About this system
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-[#64748b] font-normal max-w-2xl mx-auto tracking-normal leading-relaxed">
            Leadership, Compassion, Empowerment, Professionalism, and Excellence — built directly into your daily review journey.
          </p>
        </motion.div>

        {/* Minimal Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8"
        >
          {/* Card 1 */}
          <motion.div
            variants={cardVariants}
            whileHover={{
              y: -6,
              transition: { duration: 0.25, ease: "easeOut" },
            }}
            className="group relative bg-white rounded-2xl p-8 sm:p-9 border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_32px_rgba(0,0,0,0.06)] hover:border-amber-300/80 transition-all duration-300 flex flex-col items-center text-center"
          >
            {/* Minimal Icon Bubble */}
            <div className="w-14 h-14 rounded-xl bg-amber-50 group-hover:bg-[#E9C46A] border border-amber-200/70 group-hover:border-[#E9C46A] flex items-center justify-center mb-6 text-[#9a7822] group-hover:text-white transition-all duration-300 shadow-xs">
              <CheckCircle2 className="h-7 w-7 stroke-[1.75]" />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-[#1e293b] mb-3 tracking-tight">
              Know If You&apos;re Ready
            </h3>
            <p className="text-[#64748b] text-xs sm:text-sm leading-relaxed font-normal">
              Continuous diagnostic analytics identify your strong subjects and areas for improvement, calculating an objective readiness score for your board exam.
            </p>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            variants={cardVariants}
            whileHover={{
              y: -6,
              transition: { duration: 0.25, ease: "easeOut" },
            }}
            className="group relative bg-white rounded-2xl p-8 sm:p-9 border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_32px_rgba(0,0,0,0.06)] hover:border-amber-300/80 transition-all duration-300 flex flex-col items-center text-center"
          >
            {/* Minimal Icon Bubble */}
            <div className="w-14 h-14 rounded-xl bg-amber-50 group-hover:bg-[#E9C46A] border border-amber-200/70 group-hover:border-[#E9C46A] flex items-center justify-center mb-6 text-[#9a7822] group-hover:text-white transition-all duration-300 shadow-xs">
              <Zap className="h-7 w-7 stroke-[1.75]" />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-[#1e293b] mb-3 tracking-tight">
              Instant Results
            </h3>
            <p className="text-[#64748b] text-xs sm:text-sm leading-relaxed font-normal">
              No waiting periods. Instant automated feedback, in-depth rationales, and error diagnostics appear the exact second you submit each practice test.
            </p>
          </motion.div>

          {/* Card 3 */}
          <motion.div
            variants={cardVariants}
            whileHover={{
              y: -6,
              transition: { duration: 0.25, ease: "easeOut" },
            }}
            className="group relative bg-white rounded-2xl p-8 sm:p-9 border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_32px_rgba(0,0,0,0.06)] hover:border-amber-300/80 transition-all duration-300 flex flex-col items-center text-center"
          >
            {/* Minimal Icon Bubble */}
            <div className="w-14 h-14 rounded-xl bg-amber-50 group-hover:bg-[#E9C46A] border border-amber-200/70 group-hover:border-[#E9C46A] flex items-center justify-center mb-6 text-[#9a7822] group-hover:text-white transition-all duration-300 shadow-xs">
              <LayoutDashboard className="h-7 w-7 stroke-[1.75]" />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-[#1e293b] mb-3 tracking-tight">
              All-in-One Spot
            </h3>
            <p className="text-[#64748b] text-xs sm:text-sm leading-relaxed font-normal">
              All interactive video lectures, downloadable syllabi, handouts, test trackers, and live schedules are unified in a clean, distraction-free dashboard.
            </p>
          </motion.div>
        </motion.div>

      </div>
    </section>
  )
}
