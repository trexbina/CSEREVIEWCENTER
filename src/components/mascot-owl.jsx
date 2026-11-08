"use client"

import { useEffect, useRef } from "react"

export function MascotOwl({
  size = 40,
  className = "",
  trigger = "loop", // "loop" | "hover"
}) {
  const containerRef = useRef(null)
  const animRef = useRef(null)

  useEffect(() => {
    let isMounted = true
    let animationInstance = null

    async function loadLottie() {
      try {
        const { default: lottie } = await import("lottie-web")
        if (!isMounted || !containerRef.current) return

        const res = await fetch("/Lottie/owl-head.json")
        if (!res.ok) return
        const animationData = await res.json()

        if (!isMounted || !containerRef.current) return

        containerRef.current.innerHTML = ""

        animationInstance = lottie.loadAnimation({
          container: containerRef.current,
          renderer: "svg",
          loop: trigger === "loop",
          autoplay: trigger === "loop",
          animationData,
          rendererSettings: {
            preserveAspectRatio: "xMidYMid meet",
            progressiveLoad: true,
            hideOnTransparent: true,
          },
        })

        animRef.current = animationInstance

        if (trigger === "hover") {
          animationInstance.goToAndStop(0, true)
        }
      } catch (err) {
        console.error("Error loading Mascot Owl Lottie:", err)
      }
    }

    loadLottie()

    return () => {
      isMounted = false
      if (animationInstance) {
        animationInstance.destroy()
      }
    }
  }, [trigger])

  const handleMouseEnter = () => {
    if (trigger === "hover" && animRef.current) {
      animRef.current.goToAndPlay(0, true)
    }
  }

  const handleMouseLeave = () => {
    if (trigger === "hover" && animRef.current) {
      // let it finish or smoothly return to start
    }
  }

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden ${className}`}
      style={{ width: size, height: size }}
      aria-label="CSE Review System Mascot"
    />
  )
}

