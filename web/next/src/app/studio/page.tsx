"use client"

import { motion } from "motion/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { Studio } from "@/components/Studio"

const plushSpring = { type: "spring" as const, stiffness: 180, damping: 28, mass: 1.15 }

export default function StudioPage() {
  const router = useRouter()
  const [isStudioExpanded, setIsStudioExpanded] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-transparent p-4 text-[#1a1a1a] selection:bg-[#1a1a1a] selection:text-[#ecebe5]">
      <motion.div
        initial={false}
        animate={{
          maxWidth: isStudioExpanded ? "104rem" : "72rem",
        }}
        transition={isMounted ? plushSpring : { duration: 0 }}
        className="relative z-20 flex min-h-[95vh] w-full flex-col overflow-hidden border border-[#1a1a1a] bg-white shadow-2xl md:h-[85vh]"
      >
        <Studio onBack={() => router.push("/")} onAvailabilityOpenChange={setIsStudioExpanded} />
      </motion.div>
    </div>
  )
}
