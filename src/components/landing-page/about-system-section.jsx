"use client"

import { CheckCircle2, Zap, LayoutDashboard } from "lucide-react"
import { motion } from "framer-motion"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.18,
      delayChildren: 0.1,
    },
  },
}

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 40,
    scale: 0.94,
    borderRadius: "1.25rem",
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    borderRadius: "0.375rem",
    transition: {
      type: "spring",
      stiffness: 90,
      damping: 18,
      mass: 0.8,
    },
  },
}

export function AboutSystemSection() {
  return (
    <section id="features" className="py-16 sm:py-20 md:py-24 bg-[#fafafa] relative border-t border-b border-border/50 overflow-hidden">
      {/* Subtle decorative background morphing blur sphere */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.35, 0.55, 0.35],
          rotate: [0, 45, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -top-24 -right-24 w-96 h-96 bg-[#ebd9a6]/30 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1.1, 0.95, 1.1],
          opacity: [0.25, 0.45, 0.25],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#ebd9a6]/25 rounded-full blur-3xl pointer-events-none"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: false, amount: 0.25 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-10 sm:mb-16 flex flex-col items-center"
        >
          <div className="flex items-center gap-3 text-[#4a4a4a] justify-center mb-4">
            <motion.div
              whileHover={{ rotate: 15, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-current"
            >
              <span className="font-serif italic font-bold text-sm leading-none translate-y-[-0.5px]">i</span>
            </motion.div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-wide">
              About this system
            </h2>
          </div>
          <p className="text-xs sm:text-sm md:text-base text-gray-400 font-medium max-w-3xl mx-auto tracking-wide px-2">
            Leadership, Compassion, Empowerment, Professionalism and Excellence - that is what we believe in.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.15 }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8"
        >
          {/* Card 1 */}
          <motion.div
            variants={cardVariants}
            whileHover={{
              y: -8,
              scale: 1.02,
              boxShadow: "0 20px 30px -10px rgba(0, 0, 0, 0.08)",
              transition: { duration: 0.25, ease: "easeOut" },
            }}
            className="bg-[#ebd9a6]/70 rounded-md shadow-sm flex flex-col min-h-[280px] sm:min-h-[320px] md:min-h-[350px] overflow-hidden transition-all duration-300"
          >
            <div className="flex-1 flex items-center justify-center pt-8 sm:pt-10">
              <motion.div
                whileHover={{ rotate: [0, -10, 10, 0], scale: 1.15 }}
                transition={{ duration: 0.5 }}
              >
                <CheckCircle2 className="h-14 w-14 sm:h-16 sm:w-16 text-[#4a4a4a] stroke-[1.5]" />
              </motion.div>
            </div>
            <div className="p-6 sm:p-8 md:p-10 pt-4">
              <h3 className="text-base sm:text-lg font-bold text-[#4a4a4a] text-center mb-3 sm:mb-4 tracking-wide">Know If You&apos;re Ready</h3>
              <p className="text-[#595959] text-xs sm:text-sm leading-relaxed text-center font-medium min-h-[4.5rem]">
                The system tracks which subjects you are good at and which ones you are failing, giving you a clear score that shows if you are actually ready for the board exam.
              </p>
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            variants={cardVariants}
            whileHover={{
              y: -8,
              scale: 1.02,
              boxShadow: "0 20px 30px -10px rgba(0, 0, 0, 0.08)",
              transition: { duration: 0.25, ease: "easeOut" },
            }}
            className="bg-[#ebd9a6]/70 rounded-md shadow-sm flex flex-col min-h-[280px] sm:min-h-[320px] md:min-h-[350px] overflow-hidden transition-all duration-300"
          >
            <div className="flex-1 flex items-center justify-center pt-8 sm:pt-10">
              <motion.div
                whileHover={{ rotate: [0, -10, 10, 0], scale: 1.15 }}
                transition={{ duration: 0.5 }}
              >
                <Zap className="h-14 w-14 sm:h-16 sm:w-16 text-[#4a4a4a] stroke-[1.5]" />
              </motion.div>
            </div>
            <div className="p-6 sm:p-8 md:p-10 pt-4">
              <h3 className="text-base sm:text-lg font-bold text-[#4a4a4a] text-center mb-3 sm:mb-4 tracking-wide">Instant Results</h3>
              <p className="text-[#595959] text-xs sm:text-sm leading-relaxed text-center font-medium min-h-[4.5rem]">
                You don&apos;t have to wait days for a teacher to grade your work; you get your score and see your mistakes the second you finish a practice exam.
              </p>
            </div>
          </motion.div>

          {/* Card 3 */}
          <motion.div
            variants={cardVariants}
            whileHover={{
              y: -8,
              scale: 1.02,
              boxShadow: "0 20px 30px -10px rgba(0, 0, 0, 0.08)",
              transition: { duration: 0.25, ease: "easeOut" },
            }}
            className="bg-[#ebd9a6]/70 rounded-md shadow-sm flex flex-col min-h-[280px] sm:min-h-[320px] md:min-h-[350px] overflow-hidden sm:col-span-2 md:col-span-1 sm:max-w-sm sm:mx-auto md:max-w-none transition-all duration-300"
          >
            <div className="flex-1 flex items-center justify-center pt-8 sm:pt-10">
              <motion.div
                whileHover={{ rotate: [0, -10, 10, 0], scale: 1.15 }}
                transition={{ duration: 0.5 }}
              >
                <LayoutDashboard className="h-14 w-14 sm:h-16 sm:w-16 text-[#4a4a4a] stroke-[1.5]" />
              </motion.div>
            </div>
            <div className="p-6 sm:p-8 md:p-10 pt-4">
              <h3 className="text-base sm:text-lg font-bold text-[#4a4a4a] text-center mb-3 sm:mb-4 tracking-wide">All-in-One Spot</h3>
              <p className="text-[#595959] text-xs sm:text-sm leading-relaxed text-center font-medium min-h-[4.5rem]">
                All your videos, handouts, and quizzes are organized in one simple dashboard.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
