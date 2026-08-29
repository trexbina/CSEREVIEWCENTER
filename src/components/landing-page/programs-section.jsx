"use client"

import { motion } from "framer-motion"

export function ProgramsSection() {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-[#f8f9fa] border-t border-border/40 overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 35, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl bg-[#F2F2F3] overflow-hidden shadow-xs border border-slate-200/50"
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
              <p className="text-[#808489] text-xs sm:text-sm md:text-[15px] leading-relaxed font-normal text-justify">
                We administer review program for Philippine Nursing Licensure Examination (<strong className="text-[#505459] font-semibold">PNLE</strong>), Commission on Graduates of Foreign Nursing Schools (<strong className="text-[#505459] font-semibold">CGFNS</strong>), National Council Licensure Examination (<strong className="text-[#505459] font-semibold">NCLEX</strong>), Health Authority-Abu Dhabi (<strong className="text-[#505459] font-semibold">HAAD</strong>), Board Licensure Exam for Professional Teachers (<strong className="text-[#505459] font-semibold">BLEPT</strong>), Board Licensure Exam for Psychometrician and Psychology (<strong className="text-[#505459] font-semibold">BLEPP</strong>), International English Language Testing Service (<strong className="text-[#505459] font-semibold">IELTS</strong>), Pharmacy, Midwifery and Career Civil Service Examination.
              </p>
            </motion.div>

            {/* Right: Image */}
            <div className="h-[200px] sm:h-[250px] md:h-full md:min-h-[320px] order-1 md:order-2 overflow-hidden">
              <img 
                src="/landingpageassets/employee.png" 
                alt="Peak Excellence Team" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
