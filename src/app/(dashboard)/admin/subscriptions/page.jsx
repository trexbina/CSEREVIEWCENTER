import { getSession } from "@/lib/auth-session"
import { isAdminRole } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SubscriptionsView } from "@/components/subscriptions-view"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata = {
  title: "Manage Subscriptions | Admin Dashboard",
  description: "View and manage student access and batch review schedules.",
}

export default async function SubscriptionsPage() {
  const session = await getSession()
  if (!session?.role || !isAdminRole(session.role)) {
    redirect("/?login=1")
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-1 pb-12 space-y-6">
      <div className="border-b border-border/40 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-[#3B3B3B] dark:text-white">
          Manage Subscriptions
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Track student review access, batch schedules, and expiration dates.
        </p>
      </div>

      <SubscriptionsView />
    </div>
  )
}
