import { getSession } from "@/lib/auth-session"
import { ADMIN_ROLES } from "@/lib/auth"
import { redirect } from "next/navigation"
import { TrashClient } from "./trash-client"

export const metadata = {
  title: "Trash & Recovery | PEAK Review Center",
  description: "Recover or permanently purge deleted items in the system.",
}

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function AdminTrashPage() {
  const session = await getSession()
  if (!session || !ADMIN_ROLES.includes(session?.role)) {
    redirect("/?login=1")
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-1 pb-16 space-y-6">
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

      {/* Interactive Trash Table, Filters, Recovery & Purge */}
      <TrashClient />
    </div>
  )
}
