"use client"

import { ArrowLeft, Copy, Check } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useCallback, useEffect, useState } from "react"

const shellSpring = { type: "spring" as const, stiffness: 220, damping: 34, mass: 1.1 }
const stagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
}
const reveal = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: "easeOut" as const },
  },
}

const commands = [
  {
    cmd: "wordloom",
    desc: "Generate names with default length (5)",
  },
  {
    cmd: "wordloom --prefix no",
    desc: "Generate names starting with 'no'",
  },
  {
    cmd: "wordloom --suffix ut",
    desc: "Generate names ending with 'ut'",
  },
  {
    cmd: "wordloom --contains abs",
    desc: "Generate names containing 'abs'",
  },
  {
    cmd: "wordloom --length 6 --prefix absent",
    desc: "Generate 6-letter names starting with 'absent'",
  },
]

export function CLIDocs({ onBack }: { onBack: () => void }) {
  const [copiedState, setCopiedState] = useState<{ index: number; key: number } | null>(null)

  useEffect(() => {
    if (!copiedState) return

    const timeout = window.setTimeout(() => setCopiedState(null), 900)
    return () => window.clearTimeout(timeout)
  }, [copiedState])

  const handleCopy = useCallback((cmd: string, index: number) => {
    navigator.clipboard.writeText(cmd)
    setCopiedState({ index, key: Date.now() })
  }, [])

  return (
    <div className="w-full h-full flex flex-col relative z-20 overflow-hidden">
      <div className="flex flex-col h-full">
        <header className="border-b border-[#1a1a1a] p-6 lg:p-8 flex justify-between items-center shrink-0">
          <h1 className="font-serif text-3xl font-bold uppercase tracking-tighter">CLI Commands</h1>
          <button
            onClick={onBack}
            className="font-mono text-xs uppercase hover:underline opacity-60 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Return
          </button>
        </header>

        <div className="p-6 lg:p-8 flex-1 flex flex-col gap-6 bg-[#f8f7f2] overflow-y-auto">
          <p className="font-sans text-sm opacity-70">
            Use these commands in your terminal or the CLI tab in the Studio.
          </p>

          <div className="flex flex-col gap-4">
            {commands.map((c, i) => (
              <div
                key={i}
                className="flex flex-col sm:flex-row sm:items-center justify-between border border-[#1a1a1a] bg-white p-4 gap-4"
              >
                <div className="flex flex-col gap-1">
                  <code className="font-mono text-sm font-bold bg-[#1a1a1a] text-green-400 px-3 py-1 self-start">
                    {c.cmd}
                  </code>
                  <span className="font-sans text-xs opacity-60 uppercase tracking-widest">
                    {c.desc}
                  </span>
                </div>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleCopy(c.cmd, i)}
                  className="p-2 rounded-full hover:bg-[#1a1a1a]/10 transition-colors relative flex items-center justify-center shrink-0 h-10 w-10"
                  title="Copy"
                >
                  <AnimatePresence initial={false}>
                    {copiedState?.index === i && (
                      <motion.span
                        key={`docs-copy-pulse-${copiedState.key}`}
                        initial={{ scale: 0.5, opacity: 0.5 }}
                        animate={{ scale: 1.8, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="absolute inset-0 rounded-full border border-current"
                      />
                    )}
                  </AnimatePresence>
                  {copiedState?.index === i ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </motion.button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
