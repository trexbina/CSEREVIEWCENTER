"use client"

import { motion } from "framer-motion"

export function ProgramsSection() {
  return (
    <section className="py-10 sm:py-16 bg-white overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 35, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: false, amount: 0.25 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl bg-[#e5e7eb] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-500"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 items-center">
            {/* Left: Text */}
            <motion.div
              initial={{ opacity: 0, x: -25 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="p-6 sm:p-8 md:p-12 lg:p-14 order-2 md:order-1"
            >
              <p className="text-[#4b5563] text-xs sm:text-sm md:text-[15px] leading-relaxed font-medium text-justify">
                We administer review program for Philippine Nursing Licensure Examination (<strong className="text-[#1a1a1a]">PNLE</strong>), Commission on Graduates of Foreign Nursing Schools (<strong className="text-[#1a1a1a]">CGFNS</strong>), National Council Licensure Examination (<strong className="text-[#1a1a1a]">NCLEX</strong>), Health Authority-Abu Dhabi (<strong className="text-[#1a1a1a]">HAAD</strong>), Board Licensure Exam for Professional Teachers (<strong className="text-[#1a1a1a]">BLEPT</strong>), Board Licensure Exam for Psychometrician and Psychology (<strong className="text-[#1a1a1a]">BLEPP</strong>), International English Language Testing Service (<strong className="text-[#1a1a1a]">IELTS</strong>), Pharmacy, Midwifery and Career Civil Service Examination.
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
