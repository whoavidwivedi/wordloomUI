"use client"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Slider } from "@workspace/ui/components/slider"
import { ArrowLeft, Bookmark, BookmarkCheck, Copy, LayoutDashboard, Terminal } from "lucide-react"
import Link from "next/link"
import { useState, useTransition, useEffect, useRef, memo, useCallback } from "react"
import { toast } from "sonner"

import { generateNamesAction, getLetterOffsetsAction } from "../actions"

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

const TryResultCard = memo(function TryResultCard({
  item,
  isSaved,
  onToggleBookmark,
  onCopy,
}: {
  item: { name: string; meaning: string }
  isSaved: boolean
  onToggleBookmark: (item: { name: string; meaning: string }) => void
  onCopy: (text: string) => void
}) {
  return (
    <div
      style={{ contentVisibility: "auto", containIntrinsicSize: "0 140px" } as any}
      className="border border-[#1a1a1a] p-4 flex flex-col group hover:bg-[#1a1a1a] hover:text-white transition-colors cursor-default relative"
    >
      <button
        onClick={() => onToggleBookmark(item)}
        className="absolute top-4 right-4 text-[#1a1a1a] group-hover:text-white hover:scale-110 transition-transform"
        title={isSaved ? "Remove Bookmark" : "Save Bookmark"}
      >
        {isSaved ? (
          <BookmarkCheck className="w-5 h-5 fill-current" />
        ) : (
          <Bookmark className="w-5 h-5" />
        )}
      </button>

      <button
        onClick={() => onCopy(item.name)}
        className="absolute top-4 right-12 text-[#1a1a1a] group-hover:text-white hover:scale-110 transition-transform"
        title="Copy to Clipboard"
      >
        <Copy className="w-4 h-4" />
      </button>

      <div className="flex flex-col mb-2 pr-20">
        <span
          className="text-xl font-bold lowercase tracking-widest"
          style={{ fontFamily: "'Google Sans Flex', sans-serif" }}
        >
          {item.name}
        </span>
      </div>
      {item.meaning && (
        <>
          <p className="font-sans text-xs opacity-70 group-hover:opacity-100 line-clamp-3 leading-relaxed pr-8">
            {item.meaning}
          </p>
          <span className="absolute bottom-2 right-2 text-[8px] font-mono uppercase bg-[#1a1a1a] text-[#ecebe5] group-hover:bg-[#ecebe5] group-hover:text-[#1a1a1a] px-1 py-0.5 pointer-events-none">
            Def
          </span>
        </>
      )}
    </div>
  )
})

export default function TryPage() {
  const [mode, setMode] = useState<"ui" | "cli" | "bookmarks">("ui")
  const [cliCommand, setCliCommand] = useState("wordloom -l 5")

  const [length, setLength] = useState([5])
  const [prefix, setPrefix] = useState("")
  const [suffix, setSuffix] = useState("")
  const [contains, setContains] = useState("")

  const [isPending, startTransition] = useTransition()
  const [results, setResults] = useState<{ name: string; meaning: string }[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [skip, setSkip] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  // Bookmarks State
  const [bookmarks, setBookmarks] = useState<{ name: string; meaning: string }[]>([])
  const [hasMounted, setHasMounted] = useState(false)
  const [bookmarkSort, setBookmarkSort] = useState<"latest" | "alpha">("latest")

  const [letterOffsets, setLetterOffsets] = useState<Record<string, number>>({})
  const [activeLetter, setActiveLetter] = useState<string>("a")
  const [hasSearched, setHasSearched] = useState(false)

  const sentinelRef = useRef<HTMLDivElement>(null)
  const resultsCache = useRef<Record<number, { results: { name: string; meaning: string }[]; hasMore: boolean; totalCount: number }>>({})

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

  const toggleBookmark = useCallback((item: { name: string; meaning: string }) => {
    setBookmarks((prev) => {
      const exists = prev.some((b) => b.name === item.name)
      const updated = exists ? prev.filter((b) => b.name !== item.name) : [...prev, item]
      localStorage.setItem("wordloom_bookmarks", JSON.stringify(updated))
      return updated
    })
  }, [])

  // ScrollSpy for A-Z Navigation
  useEffect(() => {
    if (mode === "bookmarks" || results.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleLetters = entries
          .filter((e) => e.isIntersecting)
          .map((e) => e.target.getAttribute("data-letter") || "")

        if (visibleLetters.length > 0 && visibleLetters[0]) {
          // Set to the first visible letter in the viewport
          setActiveLetter(visibleLetters[0].toLowerCase())
        }
      },
      { threshold: 0.1, rootMargin: "-10% 0px -80% 0px" },
    )

    const sections = document.querySelectorAll("[data-letter]")
    sections.forEach((s) => observer.observe(s))

    return () => observer.disconnect()
  }, [results, mode])

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`Copied "${text}" to clipboard`, {
      description: "You can now paste it anywhere.",
    })
  }, [])

  const handleGenerate = () => {
    setResults([])
    setSkip(0)
    setTotalCount(0)
    setHasMore(false)
    setHasSearched(true)
    setLetterOffsets({})
    resultsCache.current = {}

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

      // Pre-calculate alphabetical offsets for A-Z Jumping
      const offsets = await getLetterOffsetsAction(
        finalLength,
        finalPrefix.toLowerCase(),
        finalSuffix.toLowerCase(),
        finalContains.toLowerCase(),
      )
      setLetterOffsets(offsets)

      const res = await generateNamesAction(
        finalLength,
        finalPrefix.toLowerCase(),
        finalSuffix.toLowerCase(),
        finalContains.toLowerCase(),
        0,
        500,
      )

      setResults(res.results)
      setTotalCount(res.count)
      setSkip(res.results.length)
      setHasMore(res.results.length < res.count)

      // Cache the first page
      resultsCache.current[0] = {
        results: res.results,
        hasMore: res.results.length < res.count,
        totalCount: res.count,
      }

      if (res.results.length > 0 && res.results[0]) {
        setActiveLetter(res.results[0].name[0]?.toLowerCase() || "a")
      }

      if (mode === "bookmarks") setMode("ui")
    })
  }

  const jumpToLetter = (letter: string) => {
    const offset = letterOffsets[letter]
    if (offset === undefined || offset === -1) return

    // 1. Check if already in current results (DOM check)
    const element = document.querySelector(`[data-letter="${letter.toUpperCase()}"]`)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
      setActiveLetter(letter)
      return
    }

    // 2. Check Cache
    const cached = resultsCache.current[offset]
    if (cached) {
      setResults(cached.results)
      setSkip(offset + cached.results.length)
      setHasMore(cached.hasMore)
      setTotalCount(cached.totalCount)
      setActiveLetter(letter)
      return
    }

    // 3. Fetch (Cache Miss)
    setResults([])
    setSkip(offset)
    setHasMore(true)
    setActiveLetter(letter)

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
        offset,
        500,
      )

      setResults(res.results)
      setSkip(offset + res.results.length)
      setHasMore(offset + res.results.length < totalCount)

      // Update Cache
      resultsCache.current[offset] = {
        results: res.results,
        hasMore: offset + res.results.length < totalCount,
        totalCount: totalCount,
      }
    })
  }

  const loadMore = () => {
    if (isPending || !hasMore) return

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
        skip,
        500,
      )

      setResults((prev) => [...prev, ...res.results])
      setSkip((prev) => prev + res.results.length)
      setHasMore(results.length + res.results.length < res.count)
    })
  }

  useEffect(() => {
    if (!hasMore || isPending) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore()
        }
      },
      { threshold: 1.0 },
    )

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, isPending, skip])

  const sortedBookmarks = [...bookmarks].sort((a, b) => {
    if (bookmarkSort === "alpha") return a.name.localeCompare(b.name)
    return 0 // Latest order
  })

  const displayedResults = mode === "bookmarks" ? sortedBookmarks : results
  const displayedCount = mode === "bookmarks" ? bookmarks.length : totalCount

  return (
    <div className="relative min-h-screen text-[#1a1a1a] flex items-center justify-center p-4 selection:bg-[#1a1a1a] selection:text-[#ecebe5] bg-transparent">
      {/* Main Container */}
      <main className="w-full max-w-6xl h-[calc(100vh-2rem)] md:h-auto md:aspect-[4/3] bg-white border border-[#1a1a1a] shadow-2xl overflow-hidden flex flex-col relative z-10">
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleGenerate()
                      }
                    }}
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleGenerate()
                      }
                    }}
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleGenerate()
                      }
                    }}
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
                  <a
                    href="https://github.com/nrjdalal/wordloom"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[10px] uppercase text-[#1a1a1a] underline hover:opacity-70"
                  >
                    View CLI Docs
                  </a>
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
                <div className="w-full flex justify-between items-center">
                  <h3 className="font-serif text-xl uppercase text-black">Your Collection</h3>
                  <div className="flex border border-[#1a1a1a] text-[10px] font-mono">
                    <button
                      onClick={() => setBookmarkSort("latest")}
                      className={`px-2 py-0.5 transition-colors ${bookmarkSort === "latest" ? "bg-[#1a1a1a] text-white" : "text-[#1a1a1a] hover:bg-neutral-100"}`}
                    >
                      Latest
                    </button>
                    <button
                      onClick={() => setBookmarkSort("alpha")}
                      className={`px-2 py-0.5 transition-colors border-l border-[#1a1a1a] ${bookmarkSort === "alpha" ? "bg-[#1a1a1a] text-white" : "text-[#1a1a1a] hover:bg-neutral-100"}`}
                    >
                      A-Z
                    </button>
                  </div>
                </div>

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

          {/* Results Area */}
          <div className="md:col-span-8 p-6 lg:p-8 flex flex-col min-h-0 bg-white">
            <div className="flex justify-between items-center border-b border-[#1a1a1a] pb-4 mb-6 shrink-0">
              <h2 className="font-sans font-semibold uppercase text-sm tracking-widest opacity-60">
                {mode === "bookmarks" ? "Saved Directory" : "Result Feed"}
              </h2>
              <span className="font-mono text-xs uppercase px-2 py-1 bg-[#ecebe5] text-[#1a1a1a]">
                {mode === "bookmarks"
                  ? `${bookmarks.length} saved`
                  : totalCount > 0
                    ? `${totalCount} found`
                    : "Idle"}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">

              {isPending ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30 gap-4">
                  <div className="w-8 h-8 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
                  <p className="font-mono text-[10px] uppercase tracking-widest">
                    {skip === 0
                      ? "Generating exhaustive set..."
                      : `Navigating to ${activeLetter}...`}
                  </p>
                </div>
              ) : displayedResults.length === 0 ? (
                <div className="h-full flex items-center justify-center opacity-30">
                  <p className="font-serif text-2xl uppercase tracking-tighter">
                    {mode === "bookmarks"
                      ? "No Bookmarks"
                      : hasSearched
                        ? "No items found"
                        : "Awaiting input..."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-12">
                  {displayedResults.map((item, i) => (
                    <div key={item.name} data-letter={item.name[0]?.toLowerCase()}>
                      <TryResultCard
                        item={item}
                        isSaved={bookmarks.some((b) => b.name === item.name)}
                        onToggleBookmark={toggleBookmark}
                        onCopy={handleCopy}
                      />
                    </div>
                  ))}
                  {mode !== "bookmarks" && hasMore && (
                    <div
                      ref={sentinelRef}
                      className="col-span-1 sm:col-span-2 py-8 flex flex-col items-center gap-4"
                    >
                      <div className="w-8 h-8 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
                      <p className="font-mono text-[10px] uppercase opacity-40">
                        Weaving more results...
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        {mode !== "bookmarks" && Object.keys(letterOffsets).length > 0 && (
          <div className="shrink-0 border-t border-[#1a1a1a] bg-white pt-4 pb-6 px-8 z-30">
            <div className="flex flex-row flex-nowrap items-center justify-between w-full max-w-7xl mx-auto">
              {"abcdefghijklmnopqrstuvwxyz".split("").map((l) => {
                const isAvailable = letterOffsets[l] !== undefined && letterOffsets[l] !== -1
                return (
                  <button
                    key={l}
                    disabled={!isAvailable}
                    onClick={() => jumpToLetter(l)}
                    className={`flex-1 text-center text-[11px] font-mono uppercase transition-all px-0.5 bg-transparent border-none
                      ${
                        activeLetter === l
                          ? "text-black font-extrabold scale-110"
                          : isAvailable
                            ? "text-neutral-500 hover:text-black"
                            : "text-neutral-300 cursor-not-allowed"
                      }
                    `}
                  >
                    <span className={!isAvailable ? "line-through opacity-40" : ""}>
                      {l}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
