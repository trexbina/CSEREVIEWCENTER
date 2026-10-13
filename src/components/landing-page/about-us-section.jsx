"use client"

import { Button } from "@/components/ui/button"
import { motion } from "motion/react"

export function AboutUsSection() {
  return (
    <section id="about" className="pt-8 sm:pt-12 md:pt-14 pb-16 sm:pb-24 md:pb-28 lg:pb-32 bg-white relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 sm:gap-12 md:gap-16 items-center">
          
          {/* Left Side: Image with organic morphing background */}
          <motion.div
            initial={{ opacity: 0, x: -50, scale: 0.95 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex justify-center pt-2 sm:pt-4 mb-8 md:mb-0"
          >
            <div className="relative w-full max-w-[20rem] sm:max-w-[24rem] md:max-w-[26rem] flex justify-center items-end">
              {/* Continuously slowly moving gradient background box (red, yellow, green) */}
              <motion.div
                animate={{
                  borderRadius: [
                    "1.5rem 2.5rem 1.5rem 2rem",
                    "2.5rem 1.5rem 2.5rem 1.5rem",
                    "1.5rem 2.5rem 1.5rem 2rem",
                  ],
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  borderRadius: {
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut",
                  },
                  backgroundPosition: {
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear",
                  },
                }}
                style={{
                  backgroundSize: "250% 250%",
                  backgroundImage:
                    "linear-gradient(135deg, rgba(239,68,68,0.45) 0%, rgba(245,158,11,0.5) 35%, rgba(233,196,106,0.55) 60%, rgba(34,197,94,0.45) 100%)",
                }}
                className="absolute inset-0 top-[18%] z-0 shadow-md backdrop-blur-xs"
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
            className="space-y-6 sm:space-y-8 flex flex-col items-center md:pl-4 lg:pl-8 pt-0 max-w-xl mx-auto md:mx-0 w-full text-center"
          >
            <div className="flex items-center justify-center gap-3 sm:gap-4 text-[#505459] w-full">
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border-2 border-[#505459]">
                <span className="font-serif italic font-bold text-sm sm:text-base leading-none translate-y-[-0.5px]">i</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-wide text-[#505459]">
                About Us
              </h2>
            </div>
            
            <div className="space-y-4 sm:space-y-6 text-xs sm:text-sm md:text-base text-[#808489] font-normal leading-relaxed text-center w-full px-2 sm:px-0">
              <p>
                The company has been involved in various review programs for more than sixteen (16) years and has maintained its quality and innovative review programs with certified top caliber National and Resident Specialist involved in providing comprehensive Lectures and Integrated Test series to improve the reviewees passing rate.
              </p>

              <p>
                It is located all over the country with several branches in Cagayan de Oro City, Butuan, Surigao, Malaybalay, Valencia, Pagadian, Ozamiz, Tacloban, Baguio, Cebu, and Dumaguete City. Its main branch is located at 3/F GJL Bldg. Julio Pacana St. Licoan, Cagayan de Oro City.
              </p>
            </div>

            <div className="pt-2 sm:pt-4 w-full flex justify-center">
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Button variant="outline" className="rounded-full border border-[#808489]/40 text-[#505459] font-medium px-8 sm:px-10 py-5 hover:bg-[#F2F2F3] hover:text-[#1e293b] hover:border-[#808489] transition-all shadow-none text-xs sm:text-sm cursor-pointer">
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
