"use client"

import { CheckCircle2, Award, Zap, Layers, BarChart3, Clock } from "lucide-react"

const FEATURES = [
  {
    icon: CheckCircle2,
    title: "Civil Service Aligned",
    desc: "Targeted coverage for Verbal, Analytical, Numerical, and General Information test scopes.",
  },
  {
    icon: Clock,
    title: "Timed Mock Exams",
    desc: "Train under authentic exam conditions with real-time countdown timers and auto-evaluations.",
  },
  {
    icon: BarChart3,
    title: "Instant Performance Analytics",
    desc: "Pinpoint your strengths and areas needing improvement with detailed breakdown charts.",
  },
  {
    icon: Layers,
    title: "Modular Lessons & PDF Guides",
    desc: "Study at your own pace with curated module summaries and downloadable materials.",
  },
]

export function AboutSystemSection() {
  return (
    <section id="features" className="py-20 bg-slate-950 text-slate-100 border-t border-slate-800">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">
            Platform Capabilities
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white mt-2">
            Engineered for Civil Service Success
          </h2>
          <p className="mt-3 text-sm text-slate-400">
            Everything examinees and review centers need in a centralized, secure environment.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((item, idx) => {
            const Icon = item.icon
            return (
              <div
                key={idx}
                className="rounded-xl bg-slate-900 border border-slate-800 p-6 hover:border-slate-700 transition-colors shadow-sm"
              >
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-100">{item.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">{item.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
