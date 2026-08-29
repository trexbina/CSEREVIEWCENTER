"use client"

import { useEffect, useState } from "react"

export function LordIcon({
  src,
  trigger = "loop",
  delay = 2000,
  colors = "primary:#505459,secondary:#808489",
  size = 64,
  className = "",
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div style={{ width: `${size}px`, height: `${size}px` }} className={`inline-flex ${className}`} />
  }

  return (
    <div
      className={`inline-flex items-center justify-center relative ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <lord-icon
        src={src}
        trigger={trigger}
        delay={delay}
        colors={colors}
        style={{ width: `${size}px`, height: `${size}px` }}
      />
    </div>
  )
}
