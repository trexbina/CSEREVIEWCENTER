import { LoginDialog } from "@/components/login-dialog"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="relative w-full h-screen min-h-[500px] sm:min-h-[600px] flex flex-col items-center justify-between overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0 bg-black">
        <img
          src="/landingpageassets/banner.png"
          alt="Peak Excellence Graduates"
          className="w-full h-full object-cover object-center opacity-95"
        />
      </div>

      {/* Floating Pill Header */}
      <header className="relative z-20 mt-6 sm:mt-10 md:mt-16 lg:mt-[116px] w-full max-w-5xl px-3 sm:px-4">
        <div className="mx-auto flex h-14 sm:h-16 md:h-20 items-center justify-between rounded-full bg-white px-2 pr-2 shadow-2xl">
          <div className="flex items-center gap-2 sm:gap-3 pl-3 sm:pl-4 md:pl-6">
            <img
              src="/landingpageassets/logo.png"
              alt="Peak Excellence Logo"
              className="h-8 sm:h-10 w-auto object-contain"
            />
            <span className="text-sm sm:text-lg md:text-xl font-bold tracking-tight text-black">
              PEAK Excellence
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-6 md:gap-10 pr-1 sm:pr-2 md:pr-4">
            <nav className="hidden sm:flex gap-4 md:gap-8 text-xs md:text-sm font-bold text-gray-500 tracking-wide">
              <a href="#contact" className="hover:text-black transition-colors">Contact Us</a>
              <a href="#faq" className="hover:text-black transition-colors">FAQ</a>
            </nav>

            <LoginDialog>
              <Button className="rounded-full bg-[#fcc926] hover:bg-[#eab308] text-black font-bold h-8 sm:h-10 md:h-12 px-4 sm:px-6 md:px-10 text-xs sm:text-sm shadow-none border-none transition-colors">
                Log In
              </Button>
            </LoginDialog>
          </div>
        </div>
      </header>

      {/* Hero Content (Center Bottom) */}
      <div className="relative z-10 w-full max-w-7xl px-4 sm:px-8 pb-10 sm:pb-16 md:pb-24 mt-auto mb-6 sm:mb-10 flex flex-col items-center text-center">
        <div className="max-w-5xl space-y-2">
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-[4.5rem] font-sans font-black text-white uppercase tracking-[0.05em] sm:tracking-[0.1em] drop-shadow-2xl leading-tight sm:leading-none">
            THE HIGHEST LEVEL OF
          </h1>
          <p className="text-sm sm:text-lg md:text-xl lg:text-2xl xl:text-[1.85rem] text-white/95 font-serif italic drop-shadow-xl leading-relaxed max-w-4xl mx-auto">
            professionalism and experience with an empowerment <br className="hidden md:block" />
            and compassion to serve others.
          </p>
        </div>
      </div>
    </section>
  )
}
