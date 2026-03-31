"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

const slides = [
    { src: "/peakassestsimage/corousel.jpg", alt: "Peak Excellence Training Academy" },
    { src: "/peakassestsimage/courosel 2.jpg", alt: "Peak Excellence 24th Anniversary" },
    { src: "/peakassestsimage/courosel 3.jpg", alt: "Peak Excellence Branches" },
]

export function DashboardCarousel() {
    const [current, setCurrent] = useState(0)

    const next = useCallback(() => setCurrent((i) => (i + 1) % slides.length), [])
    const prev = useCallback(() => setCurrent((i) => (i - 1 + slides.length) % slides.length), [])

    // Auto-advance every 5 seconds
    useEffect(() => {
        const timer = setInterval(next, 5000)
        return () => clearInterval(timer)
    }, [next])

    return (
        <div className="relative w-full overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            {/* Slide container */}
            <div className="relative aspect-[21/7] w-full overflow-hidden">
                {slides.map((slide, i) => (
                    <img
                        key={slide.src}
                        src={slide.src}
                        alt={slide.alt}
                        loading={i === 0 ? "eager" : "lazy"}
                        decoding="async"
                        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${i === current ? "opacity-100" : "opacity-0"
                            }`}
                    />
                ))}
            </div>

            {/* Left arrow */}
            <button
                onClick={prev}
                className="absolute left-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 border border-border shadow-md hover:bg-background transition-colors"
                aria-label="Previous slide"
            >
                <ChevronLeft className="h-5 w-5 text-foreground" />
            </button>

            {/* Right arrow */}
            <button
                onClick={next}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 border border-border shadow-md hover:bg-background transition-colors"
                aria-label="Next slide"
            >
                <ChevronRight className="h-5 w-5 text-foreground" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                {slides.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrent(i)}
                        className={`h-2 w-2 rounded-full transition-colors ${i === current ? "bg-primary" : "bg-foreground/30"
                            }`}
                        aria-label={`Go to slide ${i + 1}`}
                    />
                ))}
            </div>
        </div>
    )
}
