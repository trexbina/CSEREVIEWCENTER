"use client"

import { useEffect, useRef, useImperativeHandle, forwardRef } from "react"

export const LordIcon = forwardRef(function LordIcon(
  {
    src,
    size = 24,
    speed = 1,
    trigger = "loop", // "loop" | "hover" | "manual"
    delay = 3500,
    className = "",
  },
  ref
) {
  const containerRef = useRef(null)
  const animRef = useRef(null)

  useImperativeHandle(ref, () => ({
    play: () => {
      if (animRef.current) {
        animRef.current.goToAndPlay(0, true)
      }
    },
    stop: () => {
      if (animRef.current) {
        animRef.current.goToAndStop(0, true)
      }
    },
  }))

  useEffect(() => {
    if (!containerRef.current || !src) return

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

          const anim = lottie.loadAnimation({
            container: containerRef.current,
            renderer: "svg",
            loop: false,
            autoplay: trigger === "loop",
            animationData: data,
            rendererSettings: {
              preserveAspectRatio: "xMidYMid meet",
              progressiveLoad: true,
              hideOnTransparent: false,
            },
          })

          animRef.current = anim
          anim.setSpeed(speed)

          if (trigger === "hover") {
            // Start on frame 0
            anim.goToAndStop(0, true)
          } else if (trigger === "loop") {
            anim.addEventListener("complete", () => {
              if (timer) clearTimeout(timer)
              timer = setTimeout(() => {
                if (!isCancelled && animRef.current) {
                  animRef.current.goToAndPlay(0, true)
                }
              }, delay)
            })
          }
        })
        .catch((err) => console.error("Error loading animation data:", err))
    }).catch((err) => console.error("Error importing lottie-web:", err))

    return () => {
      isCancelled = true
      if (timer) clearTimeout(timer)
      if (animRef.current) {
        animRef.current.destroy()
        animRef.current = null
      }
    }
  }, [src, speed, delay, trigger])

  return (
    <div
      ref={containerRef}
      style={{ width: `${size}px`, height: `${size}px`, minWidth: `${size}px`, minHeight: `${size}px` }}
      onMouseEnter={() => {
        if (trigger === "hover" && animRef.current) {
          animRef.current.goToAndPlay(0, true)
        }
      }}
      className={`inline-flex items-center justify-center [&_svg]:!w-full [&_svg]:!h-full [&_svg]:!block ${className}`}
    />
  )
})
