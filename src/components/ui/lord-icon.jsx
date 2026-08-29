"use client"

import { useEffect, useRef } from "react"

export function LordIcon({
  src,
  size = 120,
  speed = 1,          // Playback speed: 0.5 (half speed / slower), 1 (normal), 1.5 (faster), etc.
  delay = 1500,       // Pause interval in milliseconds before repeating (0 for continuous loop)
  className = "",
}) {
  const containerRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current || !src) return

    let anim = null
    let isCancelled = false

    // Dynamically import lottie-web on client-side only (SSR safe)
    import("lottie-web").then(({ default: lottie }) => {
      if (!containerRef.current || isCancelled) return

      fetch(src)
        .then((res) => res.json())
        .then((data) => {
          if (!containerRef.current || isCancelled) return

          containerRef.current.innerHTML = ""

          anim = lottie.loadAnimation({
            container: containerRef.current,
            renderer: "svg",
            loop: delay === 0, // Continuous if delay is 0, otherwise manual delayed loop
            autoplay: true,
            animationData: data,
            rendererSettings: {
              preserveAspectRatio: "xMidYMid meet",
              progressiveLoad: true,
              hideOnTransparent: false,
            },
          })

          // Adjust playback speed
          anim.setSpeed(speed)

          // If a delay pause is requested between loops
          if (delay > 0) {
            anim.addEventListener("complete", () => {
              if (timerRef.current) clearTimeout(timerRef.current)
              timerRef.current = setTimeout(() => {
                if (!isCancelled && anim) {
                  anim.goToAndPlay(0, true)
                }
              }, delay)
            })
          }
        })
        .catch((err) => console.error("Error loading animation data:", err))
    }).catch((err) => console.error("Error importing lottie-web:", err))

    return () => {
      isCancelled = true
      if (timerRef.current) clearTimeout(timerRef.current)
      if (anim) anim.destroy()
    }
  }, [src, speed, delay])

  return (
    <div
      ref={containerRef}
      style={{ width: `${size}px`, height: `${size}px`, minWidth: `${size}px`, minHeight: `${size}px` }}
      className={`inline-flex items-center justify-center [&_svg]:!w-full [&_svg]:!h-full [&_svg]:!block ${className}`}
    />
  )
}
