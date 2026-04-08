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
    <div className="relative min-h-screen text-[#1a1a1a] flex items-center justify-center p-4 selection:bg-[#1a1a1a] selection:text-[#ecebe5] bg-[#ecebe5]">
      <motion.div
        initial={false}
        animate={{
          maxWidth: isStudioExpanded ? "104rem" : "72rem",
        }}
        transition={isMounted ? plushSpring : { duration: 0 }}
        className="w-full min-h-[95vh] md:h-[85vh] bg-white border border-[#1a1a1a] shadow-2xl relative flex flex-col z-20 overflow-hidden"
      >
        <Studio onBack={() => router.push("/")} onAvailabilityOpenChange={setIsStudioExpanded} />
      </motion.div>
    </div>
  )
}
