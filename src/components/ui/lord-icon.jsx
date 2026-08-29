"use client"

import { useEffect, useRef } from "react"

export function LordIcon({
  src,
  size = 130,
  speed = 0.65,      // Lower, smoother pace (65% of normal speed)
  delay = 2500,      // 2.5 second rest/pause before repeating
  className = "",
}) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current || !src) return

    let anim = null
    let timer = null
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
            loop: false, // We handle looping manually to allow the pause delay
            autoplay: true,
            animationData: data,
            rendererSettings: {
              preserveAspectRatio: "xMidYMid meet",
              progressiveLoad: true,
              hideOnTransparent: false,
            },
          })

          // Set custom playback speed
          anim.setSpeed(speed)

          // When the animation cycle finishes, pause for `delay` ms before playing again
          anim.addEventListener("complete", () => {
            if (timer) clearTimeout(timer)
            timer = setTimeout(() => {
              if (!isCancelled && anim) {
                anim.goToAndPlay(0, true)
              }
            }, delay)
          })
        })
        .catch((err) => console.error("Error loading animation data:", err))
    }).catch((err) => console.error("Error importing lottie-web:", err))

    return () => {
      isCancelled = true
      if (timer) clearTimeout(timer)
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
