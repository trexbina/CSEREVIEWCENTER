import { CheckCircle2, Zap, LayoutDashboard } from "lucide-react"

export function AboutSystemSection() {
  return (
    <section id="features" className="py-16 sm:py-20 md:py-24 bg-[#fafafa] relative border-t border-b border-border/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-16 flex flex-col items-center">
          <div className="flex items-center gap-3 text-[#4a4a4a] justify-center mb-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-current">
              <span className="font-serif italic font-bold text-sm leading-none translate-y-[-0.5px]">i</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-wide">
              About this system
            </h2>
          </div>
          <p className="text-xs sm:text-sm md:text-base text-gray-400 font-medium max-w-3xl mx-auto tracking-wide px-2">
            Leadership, Compassion, Empowerment, Professionalism and Excellence - that is what we believe in.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Card 1 */}
          <div className="bg-[#ebd9a6]/70 rounded-md shadow-sm flex flex-col min-h-[280px] sm:min-h-[320px] md:min-h-[350px] overflow-hidden">
            <div className="flex-1 flex items-center justify-center pt-8 sm:pt-10">
              <CheckCircle2 className="h-14 w-14 sm:h-16 sm:w-16 text-[#4a4a4a] stroke-[1.5]" />
            </div>
            <div className="p-6 sm:p-8 md:p-10 pt-4">
              <h3 className="text-base sm:text-lg font-bold text-[#4a4a4a] text-center mb-3 sm:mb-4 tracking-wide">Know If You&apos;re Ready</h3>
              <p className="text-[#595959] text-xs sm:text-sm leading-relaxed text-center font-medium min-h-[4.5rem]">
                The system tracks which subjects you are good at and which ones you are failing, giving you a clear score that shows if you are actually ready for the board exam.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-[#ebd9a6]/70 rounded-md shadow-sm flex flex-col min-h-[280px] sm:min-h-[320px] md:min-h-[350px] overflow-hidden">
            <div className="flex-1 flex items-center justify-center pt-8 sm:pt-10">
              <Zap className="h-14 w-14 sm:h-16 sm:w-16 text-[#4a4a4a] stroke-[1.5]" />
            </div>
            <div className="p-6 sm:p-8 md:p-10 pt-4">
              <h3 className="text-base sm:text-lg font-bold text-[#4a4a4a] text-center mb-3 sm:mb-4 tracking-wide">Instant Results</h3>
              <p className="text-[#595959] text-xs sm:text-sm leading-relaxed text-center font-medium min-h-[4.5rem]">
                You don&apos;t have to wait days for a teacher to grade your work; you get your score and see your mistakes the second you finish a practice exam.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-[#ebd9a6]/70 rounded-md shadow-sm flex flex-col min-h-[280px] sm:min-h-[320px] md:min-h-[350px] overflow-hidden sm:col-span-2 md:col-span-1 sm:max-w-sm sm:mx-auto md:max-w-none">
            <div className="flex-1 flex items-center justify-center pt-8 sm:pt-10">
              <LayoutDashboard className="h-14 w-14 sm:h-16 sm:w-16 text-[#4a4a4a] stroke-[1.5]" />
            </div>
            <div className="p-6 sm:p-8 md:p-10 pt-4">
              <h3 className="text-base sm:text-lg font-bold text-[#4a4a4a] text-center mb-3 sm:mb-4 tracking-wide">All-in-One Spot</h3>
              <p className="text-[#595959] text-xs sm:text-sm leading-relaxed text-center font-medium min-h-[4.5rem]">
                All your videos, handouts, and quizzes are organized in one simple dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
