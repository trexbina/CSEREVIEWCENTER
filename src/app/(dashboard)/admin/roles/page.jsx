"use client"

import React, { useState, useEffect, useCallback } from "react"
import RolesAndLimitationView from "../master-data/RolesAndLimitationView"
import { Loader2 } from "lucide-react"

export default function RolesAndLimitationPage() {
  const [roles, setRoles] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/roles")
      const data = await res.json()
      if (res.ok) {
        setRoles(data.roles || [])
      }
    } catch (e) {
      console.error("Failed to load roles:", e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  const apiCall = async (action, entity, payload) => {
    if (entity === "ROLE") {
      if (action === "ADD") {
        const res = await fetch("/api/admin/roles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to create role")
        return data.role
      }
      if (action === "UPDATE") {
        const res = await fetch("/api/admin/roles", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to update role")
        return data.role
      }
      if (action === "DELETE") {
        const res = await fetch(`/api/admin/roles?id=${payload.id}`, {
          method: "DELETE"
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to delete role")
        return data
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground">
        <Loader2 className="h-7 w-7 animate-spin text-[#E9C46A] mb-2" />
        <p className="text-xs font-medium">Loading roles & limitations…</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-4 space-y-6 animate-in fade-in duration-200">
      <RolesAndLimitationView
        roles={roles}
        fetchData={fetchRoles}
        apiCall={apiCall}
      />
    </div>
  )
}
