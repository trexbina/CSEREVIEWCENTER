"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RolesRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/admin/master-data?tab=roles")
  }, [router])

  return null
}
