"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
// @ts-ignore
import FOG from "vanta/dist/vanta.fog.min"

export default function Background() {
  const [vantaEffect, setVantaEffect] = useState<any>(null)
  const vantaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!vantaEffect && vantaRef.current) {
      try {
        setVantaEffect(
          FOG({
            el: vantaRef.current,
            THREE,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.0,
            minWidth: 200.0,
            highlightColor: 0xffc300,
            midtoneColor: 0xff1f00,
            lowlightColor: 0x2d00ff,
            baseColor: 0xffebeb,
            blurFactor: 0.6,
            speed: 1.0,
            zoom: 1.0,
          }),
        )
      } catch (err) {
        console.error("Vanta initialization failed:", err)
      }
    }
    return () => {
      if (vantaEffect) vantaEffect.destroy()
    }
  }, [vantaEffect])

  return (
    <div
      ref={vantaRef}
      className="pointer-events-none fixed inset-0 z-[-1] opacity-40 transition-opacity duration-1000"
      style={{
        background: "#ecebe5", // Fallback color
      }}
    />
  )
}
