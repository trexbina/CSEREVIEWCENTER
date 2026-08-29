"use client"

import { CheckCircle2, Zap, LayoutDashboard } from "lucide-react"
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
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

export function AboutSystemSection() {
  return (
    <section id="features" className="py-16 sm:py-20 md:py-24 bg-[#fafafa] relative border-t border-b border-slate-200/70">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header with Restored (i) Icon */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-12 sm:mb-16 flex flex-col items-center"
        >
          <div className="flex items-center gap-3 text-[#4a4a4a] justify-center mb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-current">
              <span className="font-serif italic font-bold text-sm leading-none translate-y-[-0.5px]">i</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[#1e293b] font-sans">
              About this system
            </h2>
          </div>
          
          <p className="text-xs sm:text-sm md:text-base text-[#64748b] font-normal max-w-2xl mx-auto tracking-normal leading-relaxed">
            Leadership, Compassion, Empowerment, Professionalism and Excellence - that is what we believe in.
          </p>
        </motion.div>

        {/* Minimal Static Cards Grid */}
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
            className="bg-white rounded-2xl p-7 sm:p-8 border border-slate-200 shadow-xs flex flex-col items-center text-center"
          >
            {/* Minimal Icon Bubble */}
            <div className="w-13 h-13 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center mb-5 text-[#9a7822]">
              <CheckCircle2 className="h-6.5 w-6.5 stroke-[1.75]" />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-[#1e293b] mb-2.5 tracking-tight">
              Know If You&apos;re Ready
            </h3>
            <p className="text-[#64748b] text-xs sm:text-sm leading-relaxed font-normal">
              The system tracks which subjects you are good at and which ones you are failing, giving you a clear score that shows if you are actually ready for the board exam.
            </p>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            variants={cardVariants}
            className="bg-white rounded-2xl p-7 sm:p-8 border border-slate-200 shadow-xs flex flex-col items-center text-center"
          >
            {/* Minimal Icon Bubble */}
            <div className="w-13 h-13 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center mb-5 text-[#9a7822]">
              <Zap className="h-6.5 w-6.5 stroke-[1.75]" />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-[#1e293b] mb-2.5 tracking-tight">
              Instant Results
            </h3>
            <p className="text-[#64748b] text-xs sm:text-sm leading-relaxed font-normal">
              You don&apos;t have to wait days for a teacher to grade your work; you get your score and see your mistakes the second you finish a practice exam.
            </p>
          </motion.div>

          {/* Card 3 */}
          <motion.div
            variants={cardVariants}
            className="bg-white rounded-2xl p-7 sm:p-8 border border-slate-200 shadow-xs flex flex-col items-center text-center"
          >
            {/* Minimal Icon Bubble */}
            <div className="w-13 h-13 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center mb-5 text-[#9a7822]">
              <LayoutDashboard className="h-6.5 w-6.5 stroke-[1.75]" />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-[#1e293b] mb-2.5 tracking-tight">
              All-in-One Spot
            </h3>
            <p className="text-[#64748b] text-xs sm:text-sm leading-relaxed font-normal">
              All your videos, handouts, and quizzes are organized in one simple dashboard.
            </p>
          </motion.div>
        </motion.div>

      </div>
    </section>
  )
}
