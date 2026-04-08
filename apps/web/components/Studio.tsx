"use client"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Slider } from "@workspace/ui/components/slider"
import {
  ArrowLeft,
  Check,
  Bookmark,
  BookmarkCheck,
  Copy,
  ExternalLink,
  LayoutDashboard,
  Terminal,
  X,
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"

import { generateNamesAction } from "../app/actions"

const spring = { type: "spring" as const, stiffness: 280, damping: 32, mass: 1.1 }
const fastSpring = { type: "spring" as const, stiffness: 450, damping: 34, mass: 0.75 }
const panelSpring = { type: "spring" as const, stiffness: 160, damping: 26, mass: 1.15 }

const platformDescriptions: Record<string, string> = {
  Domain: "Run a live domain search in Domainr.",
  GitHub: "Open the matching GitHub handle or org page.",
  "X (Twitter)": "Check the X profile for this name.",
  Instagram: "Open the Instagram profile lookup.",
  YouTube: "Check the YouTube handle with the @ prefix.",
}

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

function ResultCard({
  item,
  isSaved,
  isActive,
  isCopied,
  isBookmarkAnimating,
  copyFeedbackKey,
  bookmarkFeedbackKey,
  onToggleBookmark,
  onCopy,
  onCheckAvailability,
}: {
  item: { name: string; meaning: string }
  isSaved: boolean
  isActive: boolean
  isCopied: boolean
  isBookmarkAnimating: boolean
  copyFeedbackKey?: number
  bookmarkFeedbackKey?: number
  onToggleBookmark: (item: { name: string; meaning: string }) => void
  onCopy: (text: string) => void
  onCheckAvailability: (name: string) => void
}) {
  return (
    <div
      onClick={() => onCheckAvailability(item.name)}
      className={`group border p-5 flex flex-col cursor-pointer relative overflow-hidden ${
        isActive
          ? "border-[#C2A15D] bg-[#C2A15D] text-white shadow-xl ring-2 ring-[#C2A15D]/20"
          : "border-[#1a1a1a] bg-white hover:bg-[#1a1a1a] hover:text-white transition-colors duration-100 ease-out"
      }`}
    >
      {/* Background Decor */}
      <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none">
        <div className="font-serif text-8xl font-black">{item.name.charAt(0)}</div>
      </div>

      <div className="flex justify-between items-start mb-4 relative z-10">
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={(e) => {
            e.stopPropagation()
            onCheckAvailability(item.name)
          }}
          className="text-2xl font-bold lowercase tracking-tight hover:underline flex items-center gap-2"
        >
          {item.name}
        </motion.button>

        <div className="flex items-center gap-1">
          <motion.button
            type="button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation()
              onCopy(item.name)
            }}
            className="p-2 rounded-full hover:bg-white/10 transition-colors relative"
            title="Copy"
          >
            <AnimatePresence>
              {isCopied && (
                <motion.span
                  key={`copy-p-${copyFeedbackKey}`}
                  initial={{ scale: 0.5, opacity: 0.5 }}
                  animate={{ scale: 1.8, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 rounded-full border border-current"
                />
              )}
            </AnimatePresence>
            {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation()
              onToggleBookmark(item)
            }}
            className="p-2 rounded-full hover:bg-white/10 transition-colors relative"
            title="Bookmark"
          >
            <AnimatePresence>
              {isBookmarkAnimating && (
                <motion.span
                  key={`book-p-${bookmarkFeedbackKey}`}
                  initial={{ scale: 0.5, opacity: 0.5 }}
                  animate={{ scale: 1.8, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 rounded-full border border-current"
                />
              )}
            </AnimatePresence>
            {isSaved ? (
              <BookmarkCheck className="w-4 h-4 fill-current" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
          </motion.button>
        </div>
      </div>

      {item.meaning && (
        <div className="relative z-10">
          <p className="font-sans text-xs opacity-70 group-hover:opacity-90 leading-relaxed line-clamp-2">
            {item.meaning}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[8px] font-mono uppercase bg-[#1a1a1a] text-white px-1.5 py-0.5 group-hover:bg-white group-hover:text-[#1a1a1a] transition-colors">
              def
            </span>
            <span className="text-[8px] font-mono uppercase opacity-40 group-hover:opacity-60">
              {item.name.length} chars
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export function Studio({
  onBack,
  onAvailabilityOpenChange,
}: {
  onBack: () => void
  onAvailabilityOpenChange?: (isOpen: boolean) => void
}) {
  const [mode, setMode] = useState<"ui" | "cli" | "bookmarks">("ui")
  const [cliCommand, setCliCommand] = useState("wordloom -l 5")

  const [length, setLength] = useState([5])
  const [isGenerating, setIsGenerating] = useState(false) // eslint-disable-line @typescript-eslint/no-unused-vars
  const [prefix, setPrefix] = useState("")
  const [suffix, setSuffix] = useState("")
  const [contains, setContains] = useState("")

  const [isPending, startTransition] = useTransition()
  const [data, setData] = useState<{
    count: number
    results: { name: string; meaning: string }[]
  } | null>(null)
  const [availabilityTarget, setAvailabilityTarget] = useState<string | null>(null)
  const [copyFeedback, setCopyFeedback] = useState<{ name: string; key: number } | null>(null)
  const [bookmarkFeedback, setBookmarkFeedback] = useState<{ name: string; key: number } | null>(
    null,
  )

  // Bookmarks State
  const [bookmarks, setBookmarks] = useState<{ name: string; meaning: string }[]>([])
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
    const saved = localStorage.getItem("wordloom_bookmarks")
    if (saved) {
      try {
        setBookmarks(JSON.parse(saved))
      } catch (e) {
        console.error("Failed to parse bookmarks", e)
      }
    }
  }, [])

  useEffect(() => {
    if (!availabilityTarget) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAvailabilityTarget(null)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [availabilityTarget])

  useEffect(() => {
    onAvailabilityOpenChange?.(availabilityTarget !== null)
  }, [availabilityTarget, onAvailabilityOpenChange])

  useEffect(() => {
    if (!copyFeedback) return

    const timeout = window.setTimeout(() => setCopyFeedback(null), 900)
    return () => window.clearTimeout(timeout)
  }, [copyFeedback])

  useEffect(() => {
    if (!bookmarkFeedback) return

    const timeout = window.setTimeout(() => setBookmarkFeedback(null), 520)
    return () => window.clearTimeout(timeout)
  }, [bookmarkFeedback])

  const toggleBookmark = (item: { name: string; meaning: string }) => {
    setBookmarkFeedback({ name: item.name, key: Date.now() })
    setBookmarks((prev) => {
      const exists = prev.some((b) => b.name === item.name)
      const updated = exists ? prev.filter((b) => b.name !== item.name) : [...prev, item]
      localStorage.setItem("wordloom_bookmarks", JSON.stringify(updated))
      return updated
    })
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopyFeedback({ name: text, key: Date.now() })
    toast.success(`Copied "${text}" to clipboard`, {
      description: "You can now paste it anywhere.",
    })
  }

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
      if (mode === "bookmarks") setMode("ui")
    })
  }

  const displayedResults = mode === "bookmarks" ? bookmarks : (data?.results ?? null)
  const displayedCount = mode === "bookmarks" ? bookmarks.length : (data?.count ?? 0)

  // Alphabetical Grouping if we have many results
  const groupedResults =
    displayedResults && displayedResults.length > 8
      ? displayedResults.reduce(
          (acc, item) => {
            const char = item.name.charAt(0).toUpperCase()
            if (!acc[char]) acc[char] = []
            acc[char].push(item)
            return acc
          },
          {} as Record<string, { name: string; meaning: string }[]>,
        )
      : null
  const availabilityLinks = availabilityTarget
    ? [
        {
          label: "Domain",
          href: `https://domainr.com/?q=${encodeURIComponent(availabilityTarget)}`,
        },
        {
          label: "GitHub",
          href: `https://github.com/${encodeURIComponent(availabilityTarget)}`,
        },
        {
          label: "X (Twitter)",
          href: `https://x.com/${encodeURIComponent(availabilityTarget)}`,
        },
        {
          label: "Instagram",
          href: `https://instagram.com/${encodeURIComponent(availabilityTarget)}`,
        },
        {
          label: "YouTube",
          href: `https://www.youtube.com/@${encodeURIComponent(availabilityTarget)}`,
        },
      ]
    : []

  return (
    <div className="flex flex-col h-full relative z-20">
      {/* Header */}
      <header className="border-b border-[#1a1a1a] p-6 lg:p-8 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="font-serif text-3xl font-bold uppercase tracking-tighter">Studio</h2>
          <div className="hidden sm:flex border border-[#1a1a1a] text-xs font-mono ml-4">
            <button
              onClick={() => setMode("ui")}
              className={`px-3 py-1 flex items-center gap-2 transition-colors ${mode === "ui" ? "bg-[#1a1a1a] text-[#ecebe5]" : "text-[#1a1a1a] hover:bg-neutral-100"}`}
            >
              <LayoutDashboard className="w-3 h-3" /> Visual
            </button>
            <button
              onClick={() => setMode("cli")}
              className={`px-3 py-1 flex items-center gap-2 transition-colors border-l border-r border-[#1a1a1a] ${mode === "cli" ? "bg-[#1a1a1a] text-[#ecebe5]" : "text-[#1a1a1a] hover:bg-neutral-100"}`}
            >
              <Terminal className="w-3 h-3" /> CLI
            </button>
            <button
              onClick={() => setMode("bookmarks")}
              className={`px-3 py-1 flex items-center gap-2 transition-colors ${mode === "bookmarks" ? "bg-[#1a1a1a] text-[#ecebe5]" : "text-[#1a1a1a] hover:bg-neutral-100"}`}
            >
              <Bookmark className="w-3 h-3" /> Saved ({hasMounted ? bookmarks.length : 0})
            </button>
          </div>
        </div>
        <button
          onClick={onBack}
          className="font-mono text-xs uppercase hover:underline opacity-60 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Return
        </button>
      </header>

      <div className="flex-1 min-h-0 flex flex-col md:flex-row">
        {/* Controls Sidebar */}
        <div className="w-full md:w-[22rem] lg:w-[23rem] xl:w-[24rem] shrink-0 border-b md:border-b-0 md:border-r border-[#1a1a1a] bg-[#f8f7f2] p-6 lg:p-8 flex flex-col gap-8 overflow-y-auto">
          {/* Mobile Mode Toggle */}
          <div className="sm:hidden flex flex-wrap border border-[#1a1a1a] text-xs font-mono">
            <button
              onClick={() => setMode("ui")}
              className={`flex-1 py-2 px-2 flex justify-center items-center gap-2 transition-colors ${mode === "ui" ? "bg-[#1a1a1a] text-[#ecebe5]" : "text-[#1a1a1a] hover:bg-neutral-100"}`}
            >
              <LayoutDashboard className="w-3 h-3" /> Visual
            </button>
            <button
              onClick={() => setMode("cli")}
              className={`flex-1 py-2 px-2 flex justify-center items-center gap-2 transition-colors border-l border-r border-[#1a1a1a] ${mode === "cli" ? "bg-[#1a1a1a] text-[#ecebe5]" : "text-[#1a1a1a] hover:bg-neutral-100"}`}
            >
              <Terminal className="w-3 h-3" /> CLI
            </button>
            <button
              onClick={() => setMode("bookmarks")}
              className={`flex-1 py-2 px-2 flex justify-center items-center gap-2 transition-colors ${mode === "bookmarks" ? "bg-[#1a1a1a] text-[#ecebe5]" : "text-[#1a1a1a] hover:bg-neutral-100"}`}
            >
              <Bookmark className="w-3 h-3" /> Saved
            </button>
          </div>

          {mode === "ui" && (
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
                <Label htmlFor="contains" className="font-serif uppercase tracking-widest text-xs">
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

              <div className="mt-auto space-y-2">
                <div className="flex justify-between items-center px-1">
                  <span className="font-mono text-[10px] uppercase opacity-40">Loom Status</span>
                  <span className="font-mono text-[10px] uppercase text-[#1a1a1a] font-bold">
                    {isPending ? "Weaving..." : "Ready"}
                  </span>
                </div>
                <div className="pt-2 pr-2">
                  <button
                    onClick={handleGenerate}
                    disabled={isPending}
                    className="w-full h-14 bg-white text-[#1a1a1a] border-2 border-[#1a1a1a] font-serif font-bold uppercase tracking-[0.2em] text-sm shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:bg-[#1a1a1a] hover:text-white active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:opacity-50 disabled:shadow-none disabled:translate-x-[4px] disabled:translate-y-[4px] transition-none flex items-center justify-center"
                  >
                    {isPending ? "Processing" : "Generate"}
                  </button>
                </div>
              </div>
            </>
          )}

          {mode === "cli" && (
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
              </div>
              {isPending && (
                <p className="font-mono text-[10px] uppercase mt-4 text-center opacity-50 animate-pulse">
                  Running...
                </p>
              )}
            </div>
          )}

          {mode === "bookmarks" && (
            <div className="flex flex-col flex-1 h-full items-start justify-start gap-4">
              <h3 className="font-serif text-xl uppercase text-black">Your Collection</h3>
              <p className="font-sans text-sm opacity-60">
                {bookmarks.length === 0
                  ? "You haven't bookmarked any generations yet."
                  : `You have successfully saved ${bookmarks.length} phonotactic generation(s). They will presist locally on this device.`}
              </p>
              {bookmarks.length > 0 && (
                <Button
                  onClick={() => {
                    setBookmarks([])
                    localStorage.removeItem("wordloom_bookmarks")
                  }}
                  variant="outline"
                  className="mt-auto rounded-none border-[#1a1a1a] uppercase font-serif tracking-widest text-xs"
                >
                  Clear All
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Results Container */}
        <div className="min-w-0 flex-1 bg-white min-h-0">
          <div className="flex h-full min-h-0">
            {/* Feed Section */}
            <div className="flex-1 p-6 lg:p-8 flex flex-col min-w-0 min-h-0">
              <div className="flex justify-between items-center border-b border-[#1a1a1a] pb-4 mb-6 shrink-0">
                <h2 className="font-sans font-semibold uppercase text-sm tracking-widest opacity-60">
                  {mode === "bookmarks" ? "Saved Directory" : "Result Feed"}
                </h2>
                <span className="font-mono text-xs uppercase px-2 py-1 bg-[#ecebe5] text-[#1a1a1a]">
                  {mode === "bookmarks"
                    ? `${bookmarks.length} saved`
                    : data
                      ? `${data.count} found`
                      : "Idle"}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto pr-2">
                {displayedResults === null ? (
                  <div className="h-full flex items-center justify-center opacity-30">
                    <p className="font-serif text-2xl uppercase tracking-tighter">
                      {mode === "bookmarks" ? "No Bookmarks" : "Awaiting input..."}
                    </p>
                  </div>
                ) : displayedCount === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="font-serif text-lg opacity-50 text-center">
                      {mode === "bookmarks" ? "No bookmarks saved." : "0 results found"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 pb-12">
                    {mode !== "bookmarks" && (
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#1a1a1a]/60">
                        Click a generated name to check domain and social availability
                      </p>
                    )}

                    <div className="space-y-12">
                      {groupedResults ? (
                        Object.entries(groupedResults)
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([letter, items]) => (
                            <section key={letter} className="space-y-4">
                              <h3 className="font-mono text-xs font-bold bg-[#1a1a1a] text-white w-8 h-8 flex items-center justify-center">
                                {letter}
                              </h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {items.map((item) => (
                                  <ResultCard
                                    key={item.name}
                                    item={item}
                                    isSaved={bookmarks.some((b) => b.name === item.name)}
                                    isActive={availabilityTarget === item.name}
                                    isCopied={copyFeedback?.name === item.name}
                                    isBookmarkAnimating={bookmarkFeedback?.name === item.name}
                                    copyFeedbackKey={copyFeedback?.key}
                                    bookmarkFeedbackKey={bookmarkFeedback?.key}
                                    onToggleBookmark={toggleBookmark}
                                    onCopy={handleCopy}
                                    onCheckAvailability={setAvailabilityTarget}
                                  />
                                ))}
                              </div>
                            </section>
                          ))
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {displayedResults.map((item) => (
                            <ResultCard
                              key={item.name}
                              item={item}
                              isSaved={bookmarks.some((b) => b.name === item.name)}
                              isActive={availabilityTarget === item.name}
                              isCopied={copyFeedback?.name === item.name}
                              isBookmarkAnimating={bookmarkFeedback?.name === item.name}
                              copyFeedbackKey={copyFeedback?.key}
                              bookmarkFeedbackKey={bookmarkFeedback?.key}
                              onToggleBookmark={toggleBookmark}
                              onCopy={handleCopy}
                              onCheckAvailability={setAvailabilityTarget}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Availability Aside */}
            <AnimatePresence initial={false}>
              {availabilityTarget && (
                <motion.aside
                  key="availability-panel"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 440, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={panelSpring}
                  className="hidden md:flex shrink-0 border-l border-[#1a1a1a] bg-[#fbfaf5] overflow-hidden sticky top-0"
                >
                  <motion.div
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ ...panelSpring, delay: 0.08 }}
                    className="w-[420px] p-6 lg:p-8 flex flex-col"
                  >
                    <div className="flex items-start justify-between gap-4 border-b border-[#1a1a1a] pb-4">
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#1a1a1a]/60">
                          Availability Check
                        </p>
                        <motion.h3
                          key={availabilityTarget}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ ...panelSpring, delay: 0.12 }}
                          className="font-serif text-3xl font-bold lowercase tracking-tight text-[#1a1a1a]"
                        >
                          {availabilityTarget}
                        </motion.h3>
                      </div>
                      <motion.button
                        type="button"
                        whileHover={{ rotate: 90, scale: 1.05 }}
                        whileTap={{ scale: 0.9 }}
                        transition={fastSpring}
                        onClick={() => setAvailabilityTarget(null)}
                        className="text-[#1a1a1a] cursor-pointer"
                        aria-label="Close availability check"
                      >
                        <X className="h-5 w-5" />
                      </motion.button>
                    </div>

                    <p className="mt-4 text-sm font-sans text-[#1a1a1a]/70">
                      The panel slides in so you can compare the generated list and availability
                      targets side by side.
                    </p>

                    <div className="mt-6 grid gap-3">
                      {availabilityLinks.map((link) => (
                        <motion.a
                          key={link.label}
                          href={link.href}
                          target="_blank"
                          rel="noreferrer"
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.1, ease: "easeOut" }}
                          whileHover={{
                            x: 4,
                            backgroundColor: "#1a1a1a",
                            color: "#ecebe5",
                            transition: { duration: 0.08, ease: "easeOut" },
                          }}
                          whileTap={{ scale: 0.98 }}
                          className="border border-[#1a1a1a] px-4 py-4 text-[#1a1a1a] transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs uppercase tracking-[0.18em]">
                              {link.label}
                            </span>
                            <ExternalLink className="h-4 w-4" />
                          </div>
                          <p className="mt-2 text-sm font-sans opacity-70">
                            {platformDescriptions[link.label]}
                          </p>
                        </motion.a>
                      ))}
                    </div>
                  </motion.div>
                </motion.aside>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Availability Panel */}
          <AnimatePresence initial={false}>
            {availabilityTarget && (
              <motion.div
                key="availability-mobile"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={spring}
                className="md:hidden border-t border-[#1a1a1a] bg-[#f8f7f2] overflow-hidden"
              >
                <div className="p-6 flex items-start justify-between gap-4 border-b border-[#1a1a1a]">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#1a1a1a]/60">
                      Availability Check
                    </p>
                    <h3 className="font-serif text-3xl font-bold lowercase tracking-tight text-[#1a1a1a]">
                      {availabilityTarget}
                    </h3>
                  </div>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.9 }}
                    transition={fastSpring}
                    onClick={() => setAvailabilityTarget(null)}
                    className="text-[#1a1a1a]"
                    aria-label="Close availability check"
                  >
                    <X className="h-5 w-5" />
                  </motion.button>
                </div>
                <div className="p-6 grid gap-3">
                  {availabilityLinks.map((link) => (
                    <motion.a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      whileTap={{ scale: 0.985 }}
                      whileHover={{
                        backgroundColor: "#1a1a1a",
                        color: "#ecebe5",
                        transition: { duration: 0.08, ease: "easeOut" },
                      }}
                      className="border border-[#1a1a1a] px-4 py-4 text-[#1a1a1a]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs uppercase tracking-[0.18em]">
                          {link.label}
                        </span>
                        <ExternalLink className="h-4 w-4" />
                      </div>
                      <p className="mt-2 text-sm font-sans opacity-70">
                        {platformDescriptions[link.label]}
                      </p>
                    </motion.a>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
