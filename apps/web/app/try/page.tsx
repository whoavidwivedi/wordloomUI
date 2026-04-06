"use client"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Slider } from "@workspace/ui/components/slider"
import { ArrowLeft, Terminal, LayoutDashboard } from "lucide-react"
import { motion } from "motion/react"
import Link from "next/link"
import { useState, useTransition } from "react"

import VantaBackground from "@/components/vanta-background"

import { generateNamesAction } from "../actions"

function parseCliCommand(cmd: string) {
  const args = cmd.trim().split(/\s+/)
  let parsedLength = 5
  let parsedPrefix = ""
  let parsedSuffix = ""
  let parsedContains = ""

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if ((arg === "-l" || arg === "--length") && i + 1 < args.length) {
      parsedLength = parseInt(args[++i] ?? "", 10) || 5
    } else if ((arg === "-p" || arg === "--prefix") && i + 1 < args.length) {
      parsedPrefix = args[++i] ?? ""
    } else if ((arg === "-s" || arg === "--suffix") && i + 1 < args.length) {
      parsedSuffix = args[++i] ?? ""
    } else if ((arg === "-c" || arg === "--contains") && i + 1 < args.length) {
      parsedContains = args[++i] ?? ""
    }
  }

  return { parsedLength, parsedPrefix, parsedSuffix, parsedContains }
}

export default function TryPage() {
  const [mode, setMode] = useState<"ui" | "cli">("ui")
  const [cliCommand, setCliCommand] = useState("wordloom -l 5")

  const [length, setLength] = useState([5])
  const [prefix, setPrefix] = useState("")
  const [suffix, setSuffix] = useState("")
  const [contains, setContains] = useState("")

  const [isPending, startTransition] = useTransition()
  const [data, setData] = useState<{
    count: number
    results: { name: string; meaning: string }[]
  } | null>(null)

  const handleGenerate = () => {
    startTransition(async () => {
      let finalLength = length[0] ?? 5
      let finalPrefix = prefix
      let finalSuffix = suffix
      let finalContains = contains

      if (mode === "cli") {
        const parsed = parseCliCommand(cliCommand)
        finalLength = parsed.parsedLength
        finalPrefix = parsed.parsedPrefix
        finalSuffix = parsed.parsedSuffix
        finalContains = parsed.parsedContains
      }

      const res = await generateNamesAction(
        finalLength,
        finalPrefix.toLowerCase(),
        finalSuffix.toLowerCase(),
        finalContains.toLowerCase(),
      )
      setData(res)
    })
  }

  return (
    <div className="relative min-h-screen text-[#1a1a1a] flex items-center justify-center p-4 selection:bg-[#1a1a1a] selection:text-[#ecebe5]">
      <VantaBackground />

      {/* 4:3 Ratio Container */}
      <motion.main
        initial={{
          opacity: 0,
          scale: 0.92,
          y: 40,
          filter: "blur(8px)",
          transformOrigin: "bottom right",
        }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
        transition={{ type: "spring", bounce: 0, duration: 0.65 }}
        className="w-full max-w-6xl h-[calc(100vh-2rem)] md:h-auto md:aspect-[4/3] bg-white border border-[#1a1a1a] shadow-2xl overflow-hidden flex flex-col relative z-10"
      >
        {/* Header */}
        <header className="border-b border-[#1a1a1a] p-6 lg:p-8 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="font-serif text-3xl font-bold uppercase tracking-tighter">Studio</h1>
            <div className="hidden sm:flex border border-[#1a1a1a] text-xs font-mono ml-4">
              <button
                onClick={() => setMode("ui")}
                className={`px-3 py-1 flex items-center gap-2 transition-colors ${mode === "ui" ? "bg-[#1a1a1a] text-[#ecebe5]" : "text-[#1a1a1a] hover:bg-neutral-100"}`}
              >
                <LayoutDashboard className="w-3 h-3" /> Visual
              </button>
              <button
                onClick={() => setMode("cli")}
                className={`px-3 py-1 flex items-center gap-2 transition-colors border-l border-[#1a1a1a] ${mode === "cli" ? "bg-[#1a1a1a] text-[#ecebe5]" : "text-[#1a1a1a] hover:bg-neutral-100"}`}
              >
                <Terminal className="w-3 h-3" /> CLI
              </button>
            </div>
          </div>
          <Link
            href="/"
            className="font-mono text-xs uppercase hover:underline opacity-60 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Return
          </Link>
        </header>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0">
          {/* Controls Sidebar */}
          <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-[#1a1a1a] bg-[#f8f7f2] p-6 lg:p-8 flex flex-col gap-8 overflow-y-auto">
            {/* Mobile Mode Toggle */}
            <div className="sm:hidden flex border border-[#1a1a1a] text-xs font-mono">
              <button
                onClick={() => setMode("ui")}
                className={`flex-1 py-2 flex justify-center items-center gap-2 transition-colors ${mode === "ui" ? "bg-[#1a1a1a] text-[#ecebe5]" : "text-[#1a1a1a] hover:bg-neutral-100"}`}
              >
                <LayoutDashboard className="w-3 h-3" /> Visual
              </button>
              <button
                onClick={() => setMode("cli")}
                className={`flex-1 py-2 flex justify-center items-center gap-2 transition-colors border-l border-[#1a1a1a] ${mode === "cli" ? "bg-[#1a1a1a] text-[#ecebe5]" : "text-[#1a1a1a] hover:bg-neutral-100"}`}
              >
                <Terminal className="w-3 h-3" /> CLI
              </button>
            </div>

            {mode === "ui" ? (
              <>
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <Label className="font-serif uppercase tracking-widest text-[#1a1a1a]">
                      Length
                    </Label>
                    <span className="font-mono text-sm font-bold bg-[#1a1a1a] text-white px-2 py-0.5">
                      {length[0]}
                    </span>
                  </div>
                  <Slider
                    value={length}
                    onValueChange={setLength}
                    max={8}
                    min={2}
                    step={1}
                    className="cursor-pointer py-2"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prefix" className="font-serif uppercase tracking-widest text-xs">
                    Prefix
                  </Label>
                  <Input
                    id="prefix"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value.replace(/[^a-zA-Z]/g, ""))}
                    placeholder="lu"
                    maxLength={length[0]}
                    className="rounded-none border-[#1a1a1a] h-10 uppercase font-bold tracking-widest"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="suffix" className="font-serif uppercase tracking-widest text-xs">
                    Suffix
                  </Label>
                  <Input
                    id="suffix"
                    value={suffix}
                    onChange={(e) => setSuffix(e.target.value.replace(/[^a-zA-Z]/g, ""))}
                    placeholder="id"
                    maxLength={length[0]}
                    className="rounded-none border-[#1a1a1a] h-10 uppercase font-bold tracking-widest"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="contains"
                    className="font-serif uppercase tracking-widest text-xs"
                  >
                    Contains
                  </Label>
                  <Input
                    id="contains"
                    value={contains}
                    onChange={(e) => setContains(e.target.value.replace(/[^a-zA-Z]/g, ""))}
                    placeholder="min"
                    maxLength={length[0]}
                    className="rounded-none border-[#1a1a1a] h-10 uppercase font-bold tracking-widest"
                  />
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={isPending}
                  className="mt-auto rounded-none bg-[#1a1a1a] text-white uppercase font-serif tracking-widest hover:bg-[#ecebe5] hover:text-[#1a1a1a] hover:border hover:border-[#1a1a1a] transition-colors"
                >
                  {isPending ? "Computing..." : "Generate"}
                </Button>
              </>
            ) : (
              <div className="space-y-2 flex-1 flex flex-col">
                <Label
                  htmlFor="cliCommand"
                  className="font-serif uppercase tracking-widest text-xs text-[#1a1a1a]"
                >
                  Terminal
                </Label>
                <input
                  id="cliCommand"
                  type="text"
                  value={cliCommand}
                  onChange={(e) => setCliCommand(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleGenerate()
                    }
                  }}
                  className="w-full p-4 font-mono text-sm border border-[#1a1a1a] rounded-none bg-transparent text-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#1a1a1a]"
                  placeholder="wordloom -l 6 -p ma"
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="font-mono text-[10px] uppercase opacity-50">Press Enter to run</p>
                  <Link
                    href="/commands"
                    className="font-mono text-[10px] uppercase text-[#1a1a1a] underline hover:opacity-70"
                  >
                    View CLI Docs
                  </Link>
                </div>
                {isPending && (
                  <p className="font-mono text-[10px] uppercase mt-4 text-center opacity-50 animate-pulse">
                    Running...
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Results Area */}
          <div className="md:col-span-8 p-6 lg:p-8 flex flex-col min-h-0 bg-white">
            <div className="flex justify-between items-center border-b border-[#1a1a1a] pb-4 mb-6 shrink-0">
              <h2 className="font-sans font-semibold uppercase text-sm tracking-widest opacity-60">
                Result Feed
              </h2>
              <span className="font-mono text-xs uppercase px-2 py-1 bg-[#ecebe5] text-[#1a1a1a]">
                {data ? `${data.count} found` : "Idle"}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
              {!data ? (
                <div className="h-full flex items-center justify-center opacity-30">
                  <p className="font-serif text-2xl uppercase tracking-tighter">
                    Awaiting input...
                  </p>
                </div>
              ) : data.count === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="font-serif text-lg opacity-50 text-center">
                    Null constraints.
                    <br />
                    Adjust the parameters.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-12">
                  {data.results.map((item, i) => (
                    <div
                      key={i}
                      className="border border-[#1a1a1a] p-4 flex flex-col group hover:bg-[#1a1a1a] hover:text-white transition-colors cursor-default"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-serif text-xl font-bold lowercase tracking-tight">
                          {item.name}
                        </span>
                        {item.meaning && (
                          <span className="text-[10px] font-mono uppercase bg-[#1a1a1a] text-[#ecebe5] group-hover:bg-[#ecebe5] group-hover:text-[#1a1a1a] px-1 py-0.5">
                            Def
                          </span>
                        )}
                      </div>
                      {item.meaning && (
                        <p className="font-sans text-xs opacity-70 group-hover:opacity-100 line-clamp-3 leading-relaxed">
                          {item.meaning}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.main>
    </div>
  )
}
