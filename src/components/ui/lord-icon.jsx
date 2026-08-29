"use client"

import { useEffect, useRef } from "react"

export function LordIcon({
  src,
  size = 96,
  className = "",
}) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current || !src) return

    let anim = null

    // Dynamically import lottie-web on client-side only (SSR safe)
    import("lottie-web").then(({ default: lottie }) => {
      if (!containerRef.current) return

      fetch(src)
        .then((res) => res.json())
        .then((data) => {
          if (!containerRef.current) return

          containerRef.current.innerHTML = ""

          anim = lottie.loadAnimation({
            container: containerRef.current,
            renderer: "svg",
            loop: true,
            autoplay: true,
            animationData: data,
          })
        })
        .catch((err) => console.error("Error loading animation data:", err))
    }).catch((err) => console.error("Error importing lottie-web:", err))

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
