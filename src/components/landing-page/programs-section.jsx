export function ProgramsSection() {
  return (
    <section className="py-10 sm:py-16 bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-[#e5e7eb] overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 items-center">
            {/* Left: Text */}
            <div className="p-6 sm:p-8 md:p-12 lg:p-14 order-2 md:order-1">
              <p className="text-[#4b5563] text-xs sm:text-sm md:text-[15px] leading-relaxed font-medium text-justify">
                We administer review program for Philippine Nursing Licensure Examination (<strong className="text-[#1a1a1a]">PNLE</strong>), Commission on Graduates of Foreign Nursing Schools (<strong className="text-[#1a1a1a]">CGFNS</strong>), National Council Licensure Examination (<strong className="text-[#1a1a1a]">NCLEX</strong>), Health Authority-Abu Dhabi (<strong className="text-[#1a1a1a]">HAAD</strong>), Board Licensure Exam for Professional Teachers (<strong className="text-[#1a1a1a]">BLEPT</strong>), Board Licensure Exam for Psychometrician and Psychology (<strong className="text-[#1a1a1a]">BLEPP</strong>), International English Language Testing Service (<strong className="text-[#1a1a1a]">IELTS</strong>), Pharmacy, Midwifery and Career Civil Service Examination.
              </p>
            </div>

            {/* Right: Image */}
            <div className="h-[200px] sm:h-[250px] md:h-full md:min-h-[320px] order-1 md:order-2">
              <img 
                src="/landingpageassets/employee.png" 
                alt="Peak Excellence Team" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
