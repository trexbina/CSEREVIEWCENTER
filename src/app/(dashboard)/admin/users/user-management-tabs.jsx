"use client"

import { useState } from "react"
import Link from "next/link"
import { UserSearchTable } from "./user-management"
import { PreRegistrationsTab } from "./pre-registrations-tab"
import { SubscriptionsView } from "@/components/subscriptions-view"

export function UserManagementTabs({ users, currentUserId, pendingCount = 0, initialTab = "users" }) {
  const [activeTab, setActiveTab] = useState(initialTab)

  return (
    <div className="space-y-4">
      {/* Tab Switcher & Action Button Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Minimal Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-[#F2F2F2]/80 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/10">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              activeTab === "users"
                ? "bg-white dark:bg-white/15 text-[#3B3B3B] dark:text-white shadow-xs"
                : "text-[#696969] dark:text-gray-400 hover:text-[#3B3B3B] dark:hover:text-white"
            }`}
          >
            Registered Users
          </button>

          <button
            onClick={() => setActiveTab("pre-registrations")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "pre-registrations"
                ? "bg-white dark:bg-white/15 text-[#3B3B3B] dark:text-white shadow-xs"
                : "text-[#696969] dark:text-gray-400 hover:text-[#3B3B3B] dark:hover:text-white"
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

          <button
            onClick={() => setActiveTab("subscriptions")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              activeTab === "subscriptions"
                ? "bg-white dark:bg-white/15 text-[#3B3B3B] dark:text-white shadow-xs"
                : "text-[#696969] dark:text-gray-400 hover:text-[#3B3B3B] dark:hover:text-white"
            }`}
          >
            Subscriptions
          </button>
        </div>

        {/* Add User Button positioned on the right side */}
        <Link
          href="/admin/users/add"
          className="flex items-center justify-center bg-[#E9C46A] hover:bg-[#dfb550] text-white font-bold text-xs tracking-wide uppercase px-4 h-9 rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
        >
          ADD USER
        </Link>
      </div>

      {/* Tab Panels */}
      {activeTab === "users" ? (
        <div className="w-full">
          <UserSearchTable users={users} currentUserId={currentUserId} />
        </div>
      ) : activeTab === "pre-registrations" ? (
        <PreRegistrationsTab />
      ) : (
        <SubscriptionsView />
      )}
    </div>
  )
}
