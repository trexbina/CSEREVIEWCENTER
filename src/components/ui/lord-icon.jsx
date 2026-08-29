"use client"

import { useEffect, useRef } from "react"

export function LordIcon({
  src,
  trigger = "loop",
  delay = 2000,
  colors = "primary:#505459,secondary:#808489",
  size = 64,
  className = "",
}) {
  const iconRef = useRef(null)

  useEffect(() => {
    // Dynamic import to support both SSR & client custom elements
    const initLordIcon = async () => {
      try {
        const lottie = (await import("lottie-web")).default
        const { defineElement } = await import("@lordicon/element")
        if (typeof window !== "undefined" && !customElements.get("lord-icon")) {
          defineElement(lottie.loadAnimation)
        }
      } catch (err) {
        console.error("Failed to load lordicon", err)
      }
    }
    initLordIcon()
  }, [])

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <lord-icon
        ref={iconRef}
        src={src}
        trigger={trigger}
        delay={delay}
        colors={colors}
        style={{ width: `${size}px`, height: `${size}px` }}
      />
    </div>
  )
}
