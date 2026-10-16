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
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-foreground tracking-tight">Recent Learning Activity</h2>
          {activities.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground">
              {activities.length} total
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title={collapsed ? "Expand section" : "Collapse section"}
          >
            {collapsed ? (
              <>
                <span>Expand</span>
                <ChevronDown className="size-3.5" />
              </>
            ) : (
              <>
                <span>Collapse</span>
                <ChevronUp className="size-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="space-y-3 animate-in fade-in duration-200">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No recent learning activity recorded yet.</p>
          ) : (
            <>
              <div className="space-y-3">
                {displayedActivities.map((act) => {
                  const linkUrl = act.subject_id
                    ? (act.lesson_id ? `/student/subjects/${act.subject_id}?lessonId=${act.lesson_id}` : `/student/subjects/${act.subject_id}`)
                    : null

                  return (
                    <div
                      key={act.id}
                      className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-xs sm:text-sm text-foreground truncate">
                            {act.title}
                          </p>
                          {act.subject_code && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground">
                              {act.subject_code}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {new Date(act.created_at).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                          {act.details && ` · ${act.details}`}
                        </p>
                      </div>

                      {linkUrl ? (
                        <Link
                          href={linkUrl}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 transition-colors shrink-0"
                        >
                          <span>Jump</span>
                          <ChevronRight className="size-3.5" />
                        </Link>
                      ) : (
                        <span className="rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-muted text-muted-foreground shrink-0">
                          Viewed
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              {hasMore && (
                <div className="pt-2 flex justify-center border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => setExpanded(!expanded)}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold text-primary hover:bg-primary/10 transition-all cursor-pointer"
                  >
                    <span>{expanded ? "Show Less" : `View All (${activities.length})`}</span>
                    {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
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
