"use client"

import { motion } from "motion/react"
import { useRouter } from "next/navigation"

import { CLIDocs } from "@/components/CLIDocs"

const studioShellSpring = { type: "spring" as const, stiffness: 220, damping: 34, mass: 1.1 }

export default function DocsPage() {
  const router = useRouter()

  return (
    <div className="relative min-h-screen text-[#1a1a1a] flex items-center justify-center p-4 selection:bg-[#1a1a1a] selection:text-[#ecebe5] bg-[#ecebe5]">
      <div className="w-full max-w-6xl min-h-[95vh] md:min-h-0 md:aspect-[4/3] bg-white border border-[#1a1a1a] shadow-2xl relative flex flex-col z-20 overflow-hidden">
        <CLIDocs onBack={() => router.push("/")} />
      </div>
    </div>
  )
}
