"use client"

import { motion } from "framer-motion"

export function ProgramsSection() {
  return (
    <section className="bg-[#F2F2F3] border-t border-border/40 overflow-hidden">
      <div className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 items-center">
          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75, delay: 0.1 }}
            className="p-8 sm:p-12 md:p-16 lg:p-20 xl:p-24 order-2 md:order-1 max-w-2xl ml-auto"
          >
            <p className="text-[#808489] text-sm sm:text-base md:text-lg leading-relaxed font-normal text-justify">
              We administer review program for Philippine Nursing Licensure Examination (<strong className="text-[#505459] font-semibold">PNLE</strong>), Commission on Graduates of Foreign Nursing Schools (<strong className="text-[#505459] font-semibold">CGFNS</strong>), National Council Licensure Examination (<strong className="text-[#505459] font-semibold">NCLEX</strong>), Health Authority-Abu Dhabi (<strong className="text-[#505459] font-semibold">HAAD</strong>), Board Licensure Exam for Professional Teachers (<strong className="text-[#505459] font-semibold">BLEPT</strong>), Board Licensure Exam for Psychometrician and Psychology (<strong className="text-[#505459] font-semibold">BLEPP</strong>), International English Language Testing Service (<strong className="text-[#505459] font-semibold">IELTS</strong>), Pharmacy, Midwifery and Career Civil Service Examination.
            </p>
          </motion.div>

          {/* Right: Full-bleed Image */}
          <div className="h-[280px] sm:h-[340px] md:h-full md:min-h-[380px] lg:min-h-[440px] order-1 md:order-2 overflow-hidden flex items-end justify-center md:justify-start">
            <img 
              src="/landingpageassets/employee.png" 
              alt="Peak Excellence Team" 
              className="w-full h-full object-cover object-center"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
