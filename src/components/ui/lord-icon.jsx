"use client"

import { useEffect, useRef } from "react"
import lottie from "lottie-web"

export function LordIcon({
  src,
  size = 64,
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

        // Deep copy animation data
        const animData = JSON.parse(JSON.stringify(data))

        // If it uses comp_1 composition layer, extract layers for direct root playback
        if (animData.assets && animData.assets.length > 0) {
          const comp = animData.assets.find((a) => a.id === "comp_1") || animData.assets[0]
          if (comp && comp.layers && comp.layers.length > 0) {
            animData.layers = comp.layers
          }
        }

        anim = lottie.loadAnimation({
          container: containerRef.current,
          renderer: "svg",
          loop: true,
          autoplay: true,
          animationData: animData,
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
      style={{ width: `${size}px`, height: `${size}px` }}
      className={`inline-flex items-center justify-center ${className}`}
    />
  )
}
