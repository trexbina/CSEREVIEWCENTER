"use client"

import { useEffect, useRef } from "react"
import lottie from "lottie-web"

export function LordIcon({
  src,
  size = 96,
  className = "",
}) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current || !src) return

    let anim = null

    fetch(src)
      .then((res) => res.json())
      .then((data) => {
        if (!containerRef.current) return

        // Clean container before mounting
        containerRef.current.innerHTML = ""

        anim = lottie.loadAnimation({
          container: containerRef.current,
          renderer: "svg",
          loop: true,
          autoplay: true,
          animationData: data,
        })
      })
      .catch((err) => console.error("Error rendering icon:", err))

    return () => {
      if (anim) anim.destroy()
    }
  }, [src])

  return (
    <div
      ref={containerRef}
      style={{ width: `${size}px`, height: `${size}px`, minWidth: `${size}px`, minHeight: `${size}px` }}
      className={`inline-flex items-center justify-center [&_svg]:w-full [&_svg]:h-full ${className}`}
    />
  )
}
