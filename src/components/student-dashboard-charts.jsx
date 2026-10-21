"use client"

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts"

const DONUT_COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--primary) / 0.75)",
    "hsl(var(--primary) / 0.5)",
    "hsl(var(--muted-foreground) / 0.4)",
    "hsl(var(--muted-foreground) / 0.25)",
]

/* ── Dynamic Performance Chart ── */
export function LearningPerformanceChart({
    performanceData = [],
    overallAverage = null,
    trendLabel = "Steady Progress"
}) {
    // Default fallback days if no data is provided
    const chartData = performanceData && performanceData.length > 0 ? performanceData : [
        { day: "Mon", score: 0 },
        { day: "Tue", score: 0 },
        { day: "Wed", score: 0 },
        { day: "Thu", score: 0 },
        { day: "Fri", score: 0 },
        { day: "Sat", score: 0 },
        { day: "Sun", score: 0 },
    ]

    const hasScores = chartData.some(d => d.score > 0)
    const displayScore = overallAverage != null ? overallAverage : (hasScores ? Math.round(chartData.reduce((acc, c) => acc + (c.score || 0), 0) / chartData.filter(d => d.score > 0).length) : 0)

    return (
        <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md shadow-2xs overflow-hidden flex flex-col justify-between">
            <div className="relative z-10 px-5 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between border-b border-black/5 dark:border-white/5 bg-neutral-100 dark:bg-white/[0.05] shadow-[0_2px_4px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.3)]">
                <span className="text-[13px] font-medium text-neutral-600 dark:text-neutral-300 select-none">
                    Learning Performance
                </span>
                <span className="text-[11px] font-semibold text-[#3B3B3B] dark:text-white">
                    Avg: {displayScore > 0 ? `${displayScore}%` : "—"}
                </span>
            </div>

            <div className="p-5 sm:p-6 flex flex-col justify-between flex-1">
                <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-3">{trendLabel}</p>

                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="perfGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#E9C46A" stopOpacity={0.35} />
                                    <stop offset="100%" stopColor="#E9C46A" stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="hsl(var(--border) / 0.6)"
                                vertical={false}
                            />
                            <XAxis
                                dataKey="day"
                                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                domain={[0, 100]}
                                ticks={[0, 25, 50, 75, 100]}
                                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "hsl(var(--card))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "12px",
                                    color: "hsl(var(--foreground))",
                                    fontSize: "12px",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.06)"
                                }}
                                formatter={(value) => [`${value}%`, "Score"]}
                            />
                            <Area
                                type="monotone"
                                dataKey="score"
                                stroke="#E9C46A"
                                strokeWidth={2}
                                fill="url(#perfGradient)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}

/* ── Dynamic Subject Focus Donut ── */
export function SubjectFocusChart({
    focusData = [],
    totalSubjects = null,
}) {
    // If no focus data, show a friendly empty state placeholder or default subjects
    const hasData = focusData && focusData.length > 0 && focusData.some(d => d.value > 0)
    const displayData = hasData ? focusData : (focusData && focusData.length > 0 ? focusData.map(f => ({ ...f, value: Math.round(100 / focusData.length) })) : [{ name: "Subjects", value: 100 }])
    const count = totalSubjects != null ? totalSubjects : (displayData.length)

    return (
        <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-md shadow-2xs overflow-hidden flex flex-col justify-between">
            <div className="relative z-10 px-5 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between border-b border-black/5 dark:border-white/5 bg-neutral-100 dark:bg-white/[0.05] shadow-[0_2px_4px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_4px_-1px_rgba(0,0,0,0.3)]">
                <span className="text-[13px] font-medium text-neutral-600 dark:text-neutral-300 select-none">
                    Subject Focus
                </span>
                <span className="text-[11px] font-semibold text-[#3B3B3B] dark:text-white">
                    {count} {count === 1 ? "Subject" : "Subjects"}
                </span>
            </div>

            <div className="p-5 sm:p-6 flex flex-col justify-between flex-1">
                <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-2">Time spent on each subject</p>

                {/* Donut */}
                <div className="flex-1 flex items-center justify-center my-2">
                    <div className="h-[150px] w-[150px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={displayData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={45}
                                    outerRadius={68}
                                    paddingAngle={3}
                                    dataKey="value"
                                    stroke="none"
                                    startAngle={90}
                                    endAngle={-270}
                                >
                                    {displayData.map((_, i) => (
                                        <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-sm font-semibold text-[#3B3B3B] dark:text-white">
                                {count}
                            </span>
                            <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                                {count === 1 ? "Subject" : "Subjects"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Legend */}
                <div className="mt-2 space-y-1.5 max-h-[100px] overflow-y-auto pr-1">
                    {displayData.map((item, i) => (
                        <div key={item.name + i} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                                <span
                                    className="inline-block h-2 w-2 rounded-full shrink-0"
                                    style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
                                />
                                <span className="text-neutral-500 dark:text-neutral-400 truncate">{item.name}</span>
                            </div>
                            <span className="font-medium text-[#3B3B3B] dark:text-white shrink-0">{item.value}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
