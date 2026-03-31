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

/* ── Performance Chart ── */
const performanceData = [
    { day: "Mon", score: 55 },
    { day: "Tue", score: 60 },
    { day: "Wed", score: 62 },
    { day: "Thu", score: 70 },
    { day: "Fri", score: 78 },
    { day: "Sat", score: 82 },
    { day: "Sun", score: 80 },
]

export function LearningPerformanceChart() {
    return (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Learning Performance</h3>
                    <p className="text-sm text-muted-foreground">Average score stability: +4.2%</p>
                </div>
                <span className="rounded-lg bg-primary/15 px-3 py-1 text-sm font-bold text-primary">
                    SCORE: 88
                </span>
            </div>
            <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="perfGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
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
                            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            domain={[0, 100]}
                            ticks={[0, 25, 50, 75, 100]}
                            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px",
                                color: "hsl(var(--foreground))",
                                fontSize: "13px",
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="score"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            fill="url(#perfGradient)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

/* ── Subject Focus Donut ── */
const subjectData = [
    { name: "Quantum Physics", value: 33 },
    { name: "Neural Networks", value: 25 },
    { name: "Data Structures", value: 25 },
    { name: "System Design", value: 17 },
]

const DONUT_COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
]

export function SubjectFocusChart() {
    return (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground">Subject Focus</h3>
                <p className="text-sm text-muted-foreground">Weekly time allocation</p>
            </div>

            {/* Donut */}
            <div className="flex-1 flex items-center justify-center">
                <div className="h-[170px] w-[170px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={subjectData}
                                cx="50%"
                                cy="50%"
                                innerRadius={52}
                                outerRadius={78}
                                paddingAngle={3}
                                dataKey="value"
                                stroke="none"
                                startAngle={90}
                                endAngle={-270}
                            >
                                {subjectData.map((_, i) => (
                                    <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Legend */}
            <div className="mt-4 space-y-2">
                {subjectData.map((item, i) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <span
                                className="inline-block h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
                            />
                            <span className="text-muted-foreground">{item.name}</span>
                        </div>
                        <span className="font-medium text-foreground">{item.value}%</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
