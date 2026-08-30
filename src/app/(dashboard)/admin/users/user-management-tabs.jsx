"use client"

import { useState } from "react"
import { UserSearchTable } from "./user-management"
import { PreRegistrationsTab } from "./pre-registrations-tab"

export function UserManagementTabs({ users, currentUserId, pendingCount = 0 }) {
  const [activeTab, setActiveTab] = useState("users")

  return (
    <div className="space-y-6">
      {/* Minimal Tab Switcher */}
      <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("users")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
            activeTab === "users"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
          }`}
        >
          Registered Users
        </button>

        <button
          onClick={() => setActiveTab("pre-registrations")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "pre-registrations"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
          }`}
        >
          <span>Pre-Registrations</span>
          {pendingCount > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "pre-registrations"
                  ? "bg-[#E9C46A] text-white"
                  : "bg-muted-foreground/20 text-muted-foreground"
              }`}
            >
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "users" ? (
        <div className="w-full">
          <UserSearchTable users={users} currentUserId={currentUserId} />
        </div>
      ) : (
        <PreRegistrationsTab />
      )}
    </div>
  )
}
