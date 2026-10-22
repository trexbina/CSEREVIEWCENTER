export function LandingFooter() {
  return (
    <footer className="border-t border-[#d1d5db] bg-[#f5f5f5] py-6 sm:py-8 md:py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
        <div className="text-center sm:text-left">
          <p className="text-xs sm:text-sm font-medium text-[#4b5563]">
            &copy; 2026 CSE REVIEW SYSTEM
          </p>
          <p className="text-xs sm:text-sm text-[#6b7280]">
            All rights reserved.
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Facebook */}
          <a href="#" className="text-[#9ca3af] hover:text-[#6b7280] transition-colors" aria-label="Facebook">
            <svg className="h-6 w-6 sm:h-8 sm:w-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
            </svg>
          </a>
          {/* Messenger */}
          <a href="#" className="text-[#9ca3af] hover:text-[#6b7280] transition-colors" aria-label="Messenger">
            <svg className="h-6 w-6 sm:h-8 sm:w-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.908 1.434 5.503 3.678 7.2V22l3.405-1.869c.908.252 1.871.388 2.917.388 5.523 0 10-4.145 10-9.243S17.523 2 12 2zm1.054 12.453l-2.548-2.718-4.972 2.718 5.468-5.806 2.612 2.718 4.908-2.718-5.468 5.806z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  )
}
