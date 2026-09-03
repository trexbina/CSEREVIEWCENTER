import { getSession } from "@/lib/auth-session"
import { redirect } from "next/navigation"
import { Trash2, RotateCcw, ShieldAlert } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Trash & Recovery | PEAK Review Center",
  description: "Recover or permanently purge deleted items in the system.",
}

export default async function AdminTrashPage() {
  const session = await getSession()
  if (session?.role !== "admin" && session?.role !== "super_admin") {
    redirect("/login")
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-2 pb-16 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/5 dark:border-white/10">
        <div>
          <h1 className="text-xl font-bold tracking-wide text-[#3B3B3B] dark:text-white uppercase font-sans">
            TRASH & RECOVERY
          </h1>
          <p className="text-xs text-[#696969] dark:text-gray-400 mt-0.5">
            View recently deleted items, restore them to their original location, or permanently purge them.
          </p>
        </div>
      </div>

      {/* Empty State / Recovery Placeholder */}
      <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/5 p-12 text-center shadow-2xs">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#F2F2F2] dark:bg-white/10 text-[#696969] mb-4">
          <Trash2 className="size-7 stroke-[1.5]" />
        </div>
        <h2 className="text-base font-bold text-[#3B3B3B] dark:text-white">
          Trash is Empty
        </h2>
        <p className="text-xs text-[#696969] dark:text-gray-400 max-w-md mx-auto mt-1.5 leading-relaxed">
          Deleted users, courses, mock exams, or curriculum records will be held here before permanent deletion so you can recover them anytime.
        </p>
      </div>
    </div>
  )
}
