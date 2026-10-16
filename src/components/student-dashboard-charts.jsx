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
    "hsl(var(--chart-2, 173 58% 39%))",
    "hsl(var(--chart-3, 197 37% 24%))",
    "hsl(var(--chart-4, 43 74% 66%))",
    "hsl(var(--chart-5, 27 87% 67%))",
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
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-base sm:text-lg font-bold text-foreground">Learning Performance</h3>
                    <p className="text-xs text-muted-foreground">{trendLabel}</p>
                </div>
                <div className="text-right">
                    <span className="inline-flex items-center rounded-xl bg-primary/15 px-3 py-1 text-xs sm:text-sm font-extrabold text-[#8a6e1d] dark:text-primary">
                        AVG SCORE: {displayScore > 0 ? `${displayScore}%` : "—"}
                    </span>
                </div>
            </div>

            <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="perfGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="hsl(var(--border))"
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
                                borderRadius: "10px",
                                color: "hsl(var(--foreground))",
                                fontSize: "12px",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
                            }}
                            formatter={(value) => [`${value}%`, "Score"]}
                        />
                        <Area
                            type="monotone"
                            dataKey="score"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2.5}
                            fill="url(#perfGradient)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

/* ── Dynamic Subject Focus Donut ── */
export function SubjectFocusChart({
    focusData = []
}) {
    // If no focus data, show a friendly empty state placeholder or default subjects
    const hasData = focusData && focusData.length > 0 && focusData.some(d => d.value > 0)
    const displayData = hasData ? focusData : (focusData && focusData.length > 0 ? focusData.map(f => ({ ...f, value: Math.round(100 / focusData.length) })) : [{ name: "Curriculum Subjects", value: 100 }])

    return (
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
            <div className="mb-2">
                <h3 className="text-base sm:text-lg font-bold text-foreground">Subject Focus</h3>
                <p className="text-xs text-muted-foreground">Curriculum & study allocation</p>
            </div>

            {/* Donut */}
            <div className="flex-1 flex items-center justify-center my-2">
                <div className="h-[160px] w-[160px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={displayData}
                                cx="50%"
                                cy="50%"
                                innerRadius={48}
                                outerRadius={72}
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
                        <span className="text-xs font-bold text-foreground">
                            {displayData.length}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                            {displayData.length === 1 ? "Subject" : "Subjects"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="mt-2 space-y-2 max-h-[110px] overflow-y-auto pr-1">
                {displayData.map((item, i) => (
                    <div key={item.name + i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                            <span
                                className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
                            />
                            <span className="text-muted-foreground truncate">{item.name}</span>
                        </div>
                        <span className="font-bold text-foreground shrink-0">{item.value}%</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
