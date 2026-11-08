"use client"

import { motion } from "motion/react"

export function ProgramsSection() {
  return (
    <section id="programs" className="scroll-mt-8 bg-white py-10 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 35, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden rounded-2xl bg-[#eef4f7] shadow-[0_18px_48px_rgba(38,45,118,.10)] transition-shadow duration-500 hover:shadow-[0_24px_56px_rgba(38,45,118,.14)]"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 items-center">
            {/* Left: Text */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="p-6 sm:p-8 md:p-12 lg:p-14 order-2 md:order-1"
            >
              <h2 className="max-w-xl text-2xl font-bold leading-tight text-[#2f327d] sm:text-3xl">Built to organize every <span className="text-[#f48c06]">review track.</span></h2>
              <p className="mt-5 max-w-xl text-sm font-medium leading-7 text-[#4b5563] sm:text-[15px]">
                Support program-specific paths for <strong className="text-[#252641]">NCLEX</strong>, <strong className="text-[#252641]">PNLE</strong>, <strong className="text-[#252641]">BLEPT</strong>, <strong className="text-[#252641]">CSE</strong>, and the next exam your review center serves—without separating the learner experience.
              </p>
            </motion.div>

            {/* Right: Image with subtle hover zoom */}
            <div className="h-[200px] sm:h-[250px] md:h-full md:min-h-[320px] order-1 md:order-2 overflow-hidden">
              <motion.img 
                src="/landingpageassets/employee.png" 
                alt="Peak Excellence Team" 
                whileHover={{ scale: 1.06 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full h-full object-cover cursor-pointer"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
