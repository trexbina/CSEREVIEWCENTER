# Student Dashboard Design System (Mirrors Admin Dashboard Style)

The student dashboard design must strictly mirror the Admin Dashboard design system (`src/app/(dashboard)/admin`):

1. **Card Container & Header Anatomy**:
   - Container: `rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md shadow-2xs overflow-hidden flex flex-col justify-between transition-all`
   - Top Header Bar (signature style):
     `relative z-10 px-5 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between border-b border-black/5 dark:border-white/5 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.3)]`
     - Header colors:
       - Yellow/Gold: `bg-[#E9C46A]/20 dark:bg-[#E9C46A]/25`
       - Teal/Green: `bg-[#2A9D8F]/20 dark:bg-[#2A9D8F]/25`
       - Coral/Red: `bg-[#E17055]/20 dark:bg-[#E17055]/25`
       - Blue: `bg-[#3B82F6]/20 dark:bg-[#3B82F6]/25`
     - Header text: `text-[13px] font-medium text-neutral-600 dark:text-neutral-300 select-none`
   - Card Body: `p-5 sm:p-6` with large numbers in `text-3xl sm:text-4xl font-bold tracking-tight text-[#3B3B3B] dark:text-white` and metadata in `mt-1.5 text-xs text-neutral-400 dark:text-neutral-500 font-normal`.

2. **Section Headers & Action Buttons**:
   - Section headers sit outside the cards:
     ```jsx
     <div className="flex items-center justify-between px-1">
       <h2 className="text-base sm:text-lg font-semibold text-[#3B3B3B] dark:text-white tracking-tight">
         Section Title
       </h2>
       <Link className="inline-flex items-center justify-center px-3.5 h-8 rounded-xl text-xs font-semibold text-[#696969] hover:text-[#3B3B3B] dark:text-gray-400 dark:hover:text-white bg-white dark:bg-white/10 hover:bg-white/90 dark:hover:bg-white/15 border border-black/5 dark:border-white/10 transition-all shadow-2xs shrink-0 cursor-pointer">
         View all
       </Link>
     </div>
     ```
   - Primary buttons:
     `inline-flex items-center justify-center px-3.5 h-8 rounded-xl text-xs font-semibold text-white bg-[#3B3B3B] hover:bg-[#2B2B2B] dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 transition-all shadow-2xs shrink-0 cursor-pointer`

3. **Dividers and Spacing**:
   - Section spacing: `space-y-9 sm:space-y-10 pb-10`
   - Section line dividers: `<div className="border-t border-black/5 dark:border-white/10" />`

4. **Typography & Colors**:
   - Primary text: `text-[#3B3B3B] dark:text-white`
   - Secondary text: `text-neutral-600 dark:text-neutral-300` or `text-[#696969]`
   - Muted text: `text-neutral-400 dark:text-neutral-500`
