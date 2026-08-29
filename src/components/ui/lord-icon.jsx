"use client"

import { useEffect, useRef, useState } from "react"
import lottie from "lottie-web"

export function LordIcon({
  src,
  trigger = "loop",
  delay = 2000,
  colors = "primary:#505459,secondary:#808489",
  size = 64,
  className = "",
}) {
  const containerRef = useRef(null)
  const animRef = useRef(null)
  const timerRef = useRef(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !containerRef.current || !src) return

    let isCancelled = false

    const loadAnimation = async () => {
      try {
        let animationData = null

        if (typeof src === "string" && (src.startsWith("/") || src.startsWith("http"))) {
          const res = await fetch(src)
          animationData = await res.json()
        } else if (typeof src === "object") {
          animationData = src
        }

        if (isCancelled || !containerRef.current) return

        // Clean up previous instance if any
        if (animRef.current) {
          animRef.current.destroy()
        }

        const anim = lottie.loadAnimation({
          container: containerRef.current,
          renderer: "svg",
          loop: false, // We control the loop manually to support delay & triggers
          autoplay: true,
          animationData,
        })

        animRef.current = anim

        // Set up trigger loop with pause delay
        if (trigger === "loop") {
          anim.addEventListener("complete", () => {
            if (timerRef.current) clearTimeout(timerRef.current)
            timerRef.current = setTimeout(() => {
              if (!isCancelled && animRef.current) {
                animRef.current.goToAndPlay(0, true)
              }
            }, delay)
          })
        }
      } catch (err) {
        console.error("Error loading lottie animation:", err)
      }
    }

    loadAnimation()

    return () => {
      isCancelled = true
      if (timerRef.current) clearTimeout(timerRef.current)
      if (animRef.current) {
        animRef.current.destroy()
        animRef.current = null
      }
    }
  }, [src, trigger, delay, mounted])

  return (
    <div
      className={`inline-flex items-center justify-center relative ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      onMouseEnter={() => {
        if (trigger === "hover" && animRef.current) {
          animRef.current.goToAndPlay(0, true)
        }
      }}
    >
      <div
        ref={containerRef}
        style={{ width: `${size}px`, height: `${size}px` }}
        className="w-full h-full [&_svg]:w-full [&_svg]:h-full"
      />
    </div>
  )
}
