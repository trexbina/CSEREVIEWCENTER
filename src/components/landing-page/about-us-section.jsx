"use client"

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export function AboutUsSection() {
  return (
    <section id="about" className="py-16 sm:py-24 md:py-28 lg:py-32 bg-white relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 sm:gap-12 md:gap-16 items-center">
          
          {/* Left Side: Image with organic morphing background */}
          <motion.div
            initial={{ opacity: 0, x: -50, scale: 0.95 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex justify-center pt-16 sm:pt-20 lg:pt-24 mb-8 md:mb-0"
          >
            <div className="relative w-full max-w-[20rem] sm:max-w-[24rem] md:max-w-[26rem] flex justify-center items-end">
              {/* Morphing ambient grey background box */}
              <motion.div
                animate={{
                  borderRadius: [
                    "1.5rem 2.5rem 1.5rem 2rem",
                    "2.5rem 1.5rem 2.5rem 1.5rem",
                    "1.5rem 2.5rem 1.5rem 2rem",
                  ],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 top-[20%] bg-[#e5e7eb] z-0 shadow-sm"
              />
              
              <motion.img 
                src="/landingpageassets/3c129750892d50fa132c282bcbcb60c3e356f5a7.png" 
                alt="Instructor" 
                whileHover={{ scale: 1.04, y: -4 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="relative z-10 w-[90%] sm:w-[95%] h-auto object-contain transform origin-bottom drop-shadow-md cursor-pointer" 
              />
            </div>
          </motion.div>

          {/* Right Side: Text & Button */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6 sm:space-y-8 flex flex-col items-center md:pl-4 lg:pl-8 pt-0 md:pt-24 lg:pt-32 max-w-xl mx-auto md:mx-0 w-full"
          >
            <div className="flex items-center justify-center gap-3 sm:gap-4 text-[#4a4a4a] w-full">
              <motion.div
                whileHover={{ rotate: 15, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-full border-2 border-current"
              >
                <span className="font-serif italic font-bold text-sm sm:text-base leading-none translate-y-[-0.5px]">i</span>
              </motion.div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-wide text-[#4a4a4a]">
                About Us
              </h2>
            </div>
            
            <div className="space-y-4 sm:space-y-6 text-sm sm:text-[15px] text-[#4b5563] font-medium leading-[1.7] sm:leading-[1.8] text-justify w-full px-2 sm:px-0">
              <p>
                The company has been involved in various review programs for more than sixteen (16) years and has maintained its quality and innovative review programs with certified top caliber National and Resident Specialist involved in providing comprehensive Lectures and Integrated Test series to improve the reviewees passing rate.
              </p>

              <p>
                It is located all over the country with several branches in Cagayan de Oro City, Butuan, Surigao, Malaybalay, Valencia, Pagadian, Ozamiz, Tacloban, Baguio, Cebu, and Dumaguete City. Its main branch is located at 3/F GJL Bldg. Julio Pacana St. Licoan, Cagayan de Oro City.
              </p>
            </div>

            <div className="pt-2 sm:pt-4 w-full flex justify-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Button variant="outline" className="rounded-xl border-2 border-[#d1d5db] text-[#4b5563] font-bold px-8 sm:px-10 py-5 sm:py-6 hover:bg-gray-50 hover:border-gray-400 transition-all shadow-none text-sm sm:text-[15px]">
                  Learn more
                </Button>
              </motion.div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
