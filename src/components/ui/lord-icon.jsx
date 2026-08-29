"use client"

import { useEffect, useRef, useImperativeHandle, forwardRef } from "react"

export const LordIcon = forwardRef(function LordIcon(
  {
    src,
    size = 24,
    speed = 1,
    trigger = "loop", // "loop" | "hover" | "manual"
    delay = 3500,
    color, // e.g. "#E9C46A"
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

          // Deep copy animation data so color mutations don't pollute global cache
          let animData = JSON.parse(JSON.stringify(data))

          if (color) {
            // Convert hex (#E9C46A) to RGB array [0..1, 0..1, 0..1, 1]
            const hex = color.replace("#", "")
            const r = parseInt(hex.substring(0, 2), 16) / 255
            const g = parseInt(hex.substring(2, 4), 16) / 255
            const b = parseInt(hex.substring(4, 6), 16) / 255
            const targetColor = [r, g, b, 1]

            // Replace all color definitions across layers and shapes
            const replaceColors = (obj) => {
              if (!obj || typeof obj !== "object") return
              if (obj.ty === "fl" || obj.ty === "st") {
                if (obj.c && obj.c.k) {
                  if (Array.isArray(obj.c.k) && typeof obj.c.k[0] === "number") {
                    obj.c.k = targetColor
                  }
                }
              }
              for (const key of Object.keys(obj)) {
                if (typeof obj[key] === "object") {
                  replaceColors(obj[key])
                }
              }
            }
            replaceColors(animData)
          }

          const anim = lottie.loadAnimation({
            container: containerRef.current,
            renderer: "svg",
            loop: false,
            autoplay: trigger === "loop",
            animationData: animData,
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
  }, [src, speed, delay, trigger, color])

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
