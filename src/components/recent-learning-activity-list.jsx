"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown, ChevronUp, ChevronRight } from "lucide-react"

export function RecentLearningActivityList({ activities = [] }) {
  const [expanded, setExpanded] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const DEFAULT_COUNT = 4
  const hasMore = activities.length > DEFAULT_COUNT
  const displayedActivities = expanded ? activities : activities.slice(0, DEFAULT_COUNT)

  return (
    <div className="w-full space-y-3">
      {/* External Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <h2 className="text-base sm:text-lg font-semibold text-[#3B3B3B] dark:text-white tracking-tight">
            Recent Activity
          </h2>
          {activities.length > 0 && (
            <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-full">
              {activities.length} total
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="inline-flex items-center justify-center px-3.5 h-8 rounded-xl text-xs font-semibold text-[#696969] hover:text-[#3B3B3B] dark:text-gray-400 dark:hover:text-white bg-white dark:bg-white/10 hover:bg-white/90 dark:hover:bg-white/15 border border-black/5 dark:border-white/10 transition-all shadow-2xs shrink-0 cursor-pointer"
        >
          {collapsed ? "Expand" : "Collapse"}
        </button>
      </div>

      {!collapsed && (
        <div className="w-full rounded-2xl border border-black/5 dark:border-white/10 bg-black/[0.015] dark:bg-white/[0.025] backdrop-blur-md shadow-2xs px-5 sm:px-6 py-3 sm:py-3.5 divide-y divide-black/5 dark:divide-white/5 animate-in fade-in duration-200">
          {activities.length === 0 ? (
            <div className="py-6 text-center text-xs text-neutral-400 dark:text-neutral-500">
              No recent activity yet.
            </div>
          ) : (
            <>
              {displayedActivities.map((act) => {
                const linkUrl = act.subject_id
                  ? (act.lesson_id ? `/student/subjects/${act.subject_id}?lessonId=${act.lesson_id}` : `/student/subjects/${act.subject_id}`)
                  : null

                return (
                  <div
                    key={act.id}
                    className="py-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-8 rounded-full flex items-center justify-center text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 shrink-0 bg-[#E9C46A]/20 dark:bg-[#E9C46A]/25">
                        {act.title?.[0]?.toUpperCase() || "L"}
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs sm:text-sm font-medium text-[#3B3B3B] dark:text-white truncate">
                            {act.title}
                          </span>
                          {act.subject_code && (
                            <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
                              · {act.subject_code}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] sm:text-xs text-neutral-400 dark:text-neutral-500 truncate">
                          {new Date(act.created_at).toLocaleString("en-US", {
                            month: "short",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                          {act.details && ` · ${act.details}`}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {linkUrl ? (
                        <Link
                          href={linkUrl}
                          className="inline-flex items-center justify-center px-3.5 h-7 rounded-lg text-xs font-semibold text-[#696969] hover:text-[#3B3B3B] dark:text-gray-400 dark:hover:text-white bg-white dark:bg-white/10 hover:bg-white/90 border border-black/5 dark:border-white/10 transition-all shadow-2xs cursor-pointer"
                        >
                          Jump
                        </Link>
                      ) : (
                        <span className="text-xs text-neutral-400 dark:text-neutral-500">
                          Viewed
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}

              {hasMore && (
                <div className="pt-3 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setExpanded(!expanded)}
                    className="inline-flex items-center justify-center px-4 h-8 rounded-xl text-xs font-semibold text-[#696969] hover:text-[#3B3B3B] dark:text-gray-400 dark:hover:text-white bg-white dark:bg-white/10 hover:bg-white/90 border border-black/5 dark:border-white/10 transition-all shadow-2xs cursor-pointer"
                  >
                    {expanded ? "Show Less" : `View All (${activities.length})`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
