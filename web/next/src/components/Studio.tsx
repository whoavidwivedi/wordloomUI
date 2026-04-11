"use client"

import {
  ArrowLeft,
  Check,
  Bookmark,
  BookmarkCheck,
  Copy,
  ExternalLink,
  LayoutDashboard,
  X,
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { memo, useCallback, useEffect, useRef, useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

import { generateNamesAction, getLetterOffsetsAction } from "../app/actions"

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

const ResultCard = memo(function ResultCard({
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
      style={{ contentVisibility: "auto", containIntrinsicSize: "0 160px" } as any}
      className={`group relative flex h-[160px] cursor-pointer flex-col overflow-hidden border p-5 ${
        isActive
          ? "border-[#C2A15D] bg-[#C2A15D] text-white shadow-xl ring-2 ring-[#C2A15D]/20"
          : "border-[#1a1a1a] bg-white transition-colors duration-100 ease-out hover:bg-[#1a1a1a] hover:text-white"
      }`}
    >
      {/* Background Decor */}
      <div className="pointer-events-none absolute top-0 right-0 p-1 opacity-0 transition-opacity group-hover:opacity-10">
        <div className="font-serif text-8xl font-black">{item.name.charAt(0)}</div>
      </div>

      <div className="relative z-10 mb-4 flex items-start justify-between">
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={(e) => {
            e.stopPropagation()
            onCheckAvailability(item.name)
          }}
          className="flex items-center gap-2 text-2xl font-bold tracking-tight lowercase hover:underline"
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
            className="relative rounded-full p-2 transition-colors hover:bg-white/10"
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
            {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation()
              onToggleBookmark(item)
            }}
            className="relative rounded-full p-2 transition-colors hover:bg-white/10"
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
              <BookmarkCheck className="h-4 w-4 fill-current" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </motion.button>
        </div>
      </div>

      <div className="relative z-10 flex flex-1 flex-col justify-between">
        <div className="line-clamp-3 font-sans text-xs leading-relaxed opacity-70 group-hover:opacity-90">
          {item.meaning}
        </div>
        <div className="mt-3 flex h-4 items-center gap-2">
          {item.meaning && (
            <span className="bg-[#1a1a1a] px-1.5 py-0.5 font-mono text-[8px] text-white uppercase transition-colors group-hover:bg-white group-hover:text-[#1a1a1a]">
              def
            </span>
          )}
          <span className="font-mono text-[8px] uppercase opacity-40 group-hover:opacity-60">
            {item.name.length} chars
          </span>
        </div>
      </div>
    </div>
  )
})

export function Studio({
  onBack,
  onAvailabilityOpenChange,
}: {
  onBack: () => void
  onAvailabilityOpenChange?: (isOpen: boolean) => void
}) {
  const [mode, setMode] = useState<"ui" | "cli" | "bookmarks">("ui")
  const [length, setLength] = useState([5])
  const [prefix, setPrefix] = useState("")
  const [suffix, setSuffix] = useState("")
  const [contains, setContains] = useState("")

  const [isPending, startTransition] = useTransition()
  const [results, setResults] = useState<{ name: string; meaning: string }[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [skip, setSkip] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [availabilityTarget, setAvailabilityTarget] = useState<string | null>(null)
  const [copyFeedback, setCopyFeedback] = useState<{ name: string; key: number } | null>(null)
  const [bookmarkFeedback, setBookmarkFeedback] = useState<{ name: string; key: number } | null>(
    null,
  )
  const [letterOffsets, setLetterOffsets] = useState<Record<string, number>>({})
  const [activeLetter, setActiveLetter] = useState<string>("a")
  const [hasSearched, setHasSearched] = useState(false)
  const [_pendingLetter, setPendingLetter] = useState<string | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Bookmarks State
  const [bookmarks, setBookmarks] = useState<{ name: string; meaning: string }[]>([])
  const [hasMounted, setHasMounted] = useState(false)
  const [bookmarkSort, setBookmarkSort] = useState<"latest" | "alpha">("latest")

  const sentinelRef = useRef<HTMLDivElement>(null)
  const resultsCache = useRef<
    Record<
      number,
      { results: { name: string; meaning: string }[]; hasMore: boolean; totalCount: number }
    >
  >({})

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

  const toggleBookmark = useCallback((item: { name: string; meaning: string }) => {
    setBookmarkFeedback({ name: item.name, key: Date.now() })
    setBookmarks((prev) => {
      const exists = prev.some((b) => b.name === item.name)
      const updated = exists ? prev.filter((b) => b.name !== item.name) : [...prev, item]
      localStorage.setItem("wordloom_bookmarks", JSON.stringify(updated))
      return updated
    })
  }, [])

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
    setCopyFeedback({ name: text, key: Date.now() })
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

  const scrollToLetterSection = (letter: string) => {
    requestAnimationFrame(() => {
      const container = scrollContainerRef.current
      if (!container) return

      const element = container.querySelector(
        `[data-letter="${letter.toUpperCase()}"]`,
      ) as HTMLElement
      if (element) {
        // Calculate offset relative to the container
        const targetScroll = element.offsetTop
        container.scrollTop = targetScroll
      }
    })
  }

  const jumpToLetter = (letter: string) => {
    const offset = letterOffsets[letter]
    if (offset === undefined || offset === -1) return

    // 1. Check if already in current results (DOM check)
    scrollToLetterSection(letter)
    setActiveLetter(letter)

    // 2. Check Cache (Optimization)
    const cached = resultsCache.current[offset]
    if (cached) {
      setPendingLetter(null) // Ensure cleared on cache hit
      setResults((prev) => {
        const map = new Map(prev.map((i) => [i.name, i]))
        cached.results.forEach((i) => map.set(i.name, i))
        return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
      })
      setSkip(offset + cached.results.length)
      setHasMore(cached.hasMore)
      setTotalCount(cached.totalCount)
      setActiveLetter(letter)
      scrollToLetterSection(letter)
      return
    }

    // 3. Fetch (Cache Miss)
    setSkip(offset)
    setHasMore(true)
    setActiveLetter(letter)
    setPendingLetter(letter.toUpperCase())

    startTransition(async () => {
      let finalLength = length[0] ?? 5
      let finalPrefix = prefix
      let finalSuffix = suffix
      let finalContains = contains

      const res = await generateNamesAction(
        finalLength,
        finalPrefix.toLowerCase(),
        finalSuffix.toLowerCase(),
        finalContains.toLowerCase(),
        offset,
        500,
      )

      setResults((prev) => {
        const map = new Map(prev.map((i) => [i.name, i]))
        res.results.forEach((i) => map.set(i.name, i))
        return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
      })
      setSkip(offset + res.results.length)
      setHasMore(offset + res.results.length < totalCount)

      // Update Cache
      resultsCache.current[offset] = {
        results: res.results,
        hasMore: offset + res.results.length < totalCount,
        totalCount: totalCount,
      }

      setPendingLetter(null)
      scrollToLetterSection(letter)
    })
  }

  const loadMore = () => {
    if (isPending || !hasMore) return

    startTransition(async () => {
      let finalLength = length[0] ?? 5
      let finalPrefix = prefix
      let finalSuffix = suffix
      let finalContains = contains

      const res = await generateNamesAction(
        finalLength,
        finalPrefix.toLowerCase(),
        finalSuffix.toLowerCase(),
        finalContains.toLowerCase(),
        skip,
        500,
      )

      setResults((prev) => {
        const map = new Map(prev.map((i) => [i.name, i]))
        res.results.forEach((i) => map.set(i.name, i))
        return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
      })
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
    return 0 // Latest is default (array order)
  })

  const displayedResults = mode === "bookmarks" ? sortedBookmarks : results

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
    <div className="relative z-20 flex h-full flex-col">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-[#1a1a1a] p-6 lg:p-8">
        <div className="flex items-center gap-4">
          <h2 className="font-serif text-3xl font-bold tracking-tighter uppercase">Studio</h2>
          <div className="ml-4 hidden border border-[#1a1a1a] font-mono text-xs sm:flex">
            <button
              onClick={() => setMode("ui")}
              className={`flex items-center gap-2 px-3 py-1 transition-colors ${mode === "ui" ? "bg-[#1a1a1a] text-[#ecebe5]" : "text-[#1a1a1a] hover:bg-neutral-100"}`}
            >
              <LayoutDashboard className="h-3 w-3" /> Visual
            </button>
            <button
              onClick={() => setMode("bookmarks")}
              className={`flex items-center gap-2 border-l border-[#1a1a1a] px-3 py-1 transition-colors ${mode === "bookmarks" ? "bg-[#1a1a1a] text-[#ecebe5]" : "text-[#1a1a1a] hover:bg-neutral-100"}`}
            >
              <Bookmark className="h-3 w-3" /> Saved ({hasMounted ? bookmarks.length : 0})
            </button>
          </div>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 font-mono text-xs uppercase opacity-60 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Return
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* Controls Sidebar */}
        <div className="flex w-full shrink-0 flex-col gap-8 overflow-y-auto border-b border-[#1a1a1a] bg-[#f8f7f2] p-6 md:w-[22rem] md:border-r md:border-b-0 lg:w-[23rem] lg:p-8 xl:w-[24rem]">
          {/* Mobile Mode Toggle */}
          <div className="flex flex-wrap border border-[#1a1a1a] font-mono text-xs sm:hidden">
            <button
              onClick={() => setMode("ui")}
              className={`flex flex-1 items-center justify-center gap-2 px-2 py-2 transition-colors ${mode === "ui" ? "bg-[#1a1a1a] text-[#ecebe5]" : "text-[#1a1a1a] hover:bg-neutral-100"}`}
            >
              <LayoutDashboard className="h-3 w-3" /> Visual
            </button>
            <button
              onClick={() => setMode("bookmarks")}
              className={`flex flex-1 items-center justify-center gap-2 border-l border-[#1a1a1a] px-2 py-2 transition-colors ${mode === "bookmarks" ? "bg-[#1a1a1a] text-[#ecebe5]" : "text-[#1a1a1a] hover:bg-neutral-100"}`}
            >
              <Bookmark className="h-3 w-3" /> Saved
            </button>
          </div>

          {mode === "ui" && (
            <>
              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <Label className="font-serif tracking-widest text-[#1a1a1a] uppercase">
                    Length
                  </Label>
                  <span className="bg-[#1a1a1a] px-2 py-0.5 font-mono text-sm font-bold text-white">
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
                <Label htmlFor="prefix" className="font-serif text-xs tracking-widest uppercase">
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
                  maxLength={length[0]}
                  className="h-10 rounded-none border-[#1a1a1a] font-bold tracking-widest uppercase"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="suffix" className="font-serif text-xs tracking-widest uppercase">
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
                  maxLength={length[0]}
                  className="h-10 rounded-none border-[#1a1a1a] font-bold tracking-widest uppercase"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contains" className="font-serif text-xs tracking-widest uppercase">
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
                  maxLength={length[0]}
                  className="h-10 rounded-none border-[#1a1a1a] font-bold tracking-widest uppercase"
                />
              </div>

              <div className="mt-auto space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="font-mono text-[10px] uppercase opacity-40">Loom Status</span>
                  <span className="font-mono text-[10px] font-bold text-[#1a1a1a] uppercase">
                    {isPending ? "Weaving..." : "Ready"}
                  </span>
                </div>
                <div className="pt-2 pr-2">
                  <button
                    onClick={handleGenerate}
                    disabled={isPending}
                    className="flex h-14 w-full items-center justify-center border-2 border-[#1a1a1a] bg-white font-serif text-sm font-bold tracking-[0.2em] text-[#1a1a1a] uppercase shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] transition-none hover:bg-[#1a1a1a] hover:text-white active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:translate-x-[4px] disabled:translate-y-[4px] disabled:opacity-50 disabled:shadow-none"
                  >
                    {isPending ? "Processing" : "Generate"}
                  </button>
                </div>
              </div>
            </>
          )}

          {mode === "bookmarks" && (
            <div className="flex h-full flex-1 flex-col items-start justify-start gap-4">
              <div className="flex w-full items-center justify-between">
                <h3 className="font-serif text-xl text-black uppercase">Your Collection</h3>
                <div className="flex border border-[#1a1a1a] font-mono text-[10px]">
                  <button
                    onClick={() => setBookmarkSort("latest")}
                    className={`px-2 py-0.5 transition-colors ${bookmarkSort === "latest" ? "bg-[#1a1a1a] text-white" : "text-[#1a1a1a] hover:bg-neutral-100"}`}
                  >
                    Latest
                  </button>
                  <button
                    onClick={() => setBookmarkSort("alpha")}
                    className={`border-l border-[#1a1a1a] px-2 py-0.5 transition-colors ${bookmarkSort === "alpha" ? "bg-[#1a1a1a] text-white" : "text-[#1a1a1a] hover:bg-neutral-100"}`}
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
                  className="mt-auto rounded-none border-[#1a1a1a] font-serif text-xs tracking-widest uppercase"
                >
                  Clear All
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Results Container */}
        <div className="min-h-0 min-w-0 flex-1 bg-white">
          <div className="flex h-full min-h-0">
            {/* Feed Section */}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col p-6 lg:p-8">
              <div className="mb-6 flex shrink-0 items-center justify-between border-b border-[#1a1a1a] pb-4">
                <h2 className="font-sans text-sm font-semibold tracking-widest uppercase opacity-60">
                  {mode === "bookmarks" ? "Saved Directory" : "Result Feed"}
                </h2>
                <span className="bg-[#ecebe5] px-2 py-1 font-mono text-xs text-[#1a1a1a] uppercase">
                  {mode === "bookmarks"
                    ? `${bookmarks.length} saved`
                    : totalCount > 0
                      ? `${totalCount} found`
                      : "Idle"}
                </span>
              </div>

              <div ref={scrollContainerRef} className="relative flex-1 overflow-y-auto pr-2">
                {isPending && skip === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-4 opacity-30">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1a1a1a] border-t-transparent" />
                    <p className="font-mono text-[10px] tracking-widest uppercase">
                      Generating exhaustive set...
                    </p>
                  </div>
                ) : displayedResults.length === 0 ? (
                  <div className="flex h-full items-center justify-center opacity-30">
                    <p className="font-serif text-2xl tracking-tighter uppercase">
                      {mode === "bookmarks"
                        ? "No Bookmarks"
                        : hasSearched
                          ? "No items found"
                          : "Awaiting input..."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 pb-12">
                    <div className="space-y-12">
                      {groupedResults ? (
                        (() => {
                          const entries = Object.entries(groupedResults).sort(([a], [b]) =>
                            a.localeCompare(b),
                          )
                          return entries.map(([letter, items]) => (
                            <section
                              key={letter}
                              data-letter={letter}
                              className="-mt-4 space-y-4 pt-4"
                            >
                              <h3 className="flex h-8 w-8 items-center justify-center bg-[#1a1a1a] font-mono text-xs font-bold text-white">
                                {letter}
                              </h3>
                              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                        })()
                      ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    {mode !== "bookmarks" && hasMore && (
                      <div ref={sentinelRef} className="flex flex-col items-center gap-4 py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1a1a1a] border-t-transparent" />
                        <p className="font-mono text-[10px] uppercase opacity-40">
                          Loading more possibilities...
                        </p>
                      </div>
                    )}
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
                  className="sticky top-0 hidden shrink-0 overflow-hidden border-l border-[#1a1a1a] bg-[#fbfaf5] md:flex"
                >
                  <motion.div
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ ...panelSpring, delay: 0.08 }}
                    className="flex w-[420px] flex-col p-6 lg:p-8"
                  >
                    <div className="flex items-start justify-between gap-4 border-b border-[#1a1a1a] pb-4">
                      <div>
                        <p className="font-mono text-[10px] tracking-[0.2em] text-[#1a1a1a]/60 uppercase">
                          Availability Check
                        </p>
                        <motion.h3
                          key={availabilityTarget}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ ...panelSpring, delay: 0.12 }}
                          className="font-serif text-3xl font-bold tracking-tight text-[#1a1a1a] lowercase"
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
                        className="cursor-pointer text-[#1a1a1a]"
                        aria-label="Close availability check"
                      >
                        <X className="h-5 w-5" />
                      </motion.button>
                    </div>

                    <p className="mt-4 font-sans text-sm text-[#1a1a1a]/70">
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
                            <span className="font-mono text-xs tracking-[0.18em] uppercase">
                              {link.label}
                            </span>
                            <ExternalLink className="h-4 w-4" />
                          </div>
                          <p className="mt-2 font-sans text-sm opacity-70">
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
                className="overflow-hidden border-t border-[#1a1a1a] bg-[#f8f7f2] md:hidden"
              >
                <div className="flex items-start justify-between gap-4 border-b border-[#1a1a1a] p-6">
                  <div>
                    <p className="font-mono text-[10px] tracking-[0.2em] text-[#1a1a1a]/60 uppercase">
                      Availability Check
                    </p>
                    <h3 className="font-serif text-3xl font-bold tracking-tight text-[#1a1a1a] lowercase">
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
                <div className="grid gap-3 p-6">
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
                        <span className="font-mono text-xs tracking-[0.18em] uppercase">
                          {link.label}
                        </span>
                        <ExternalLink className="h-4 w-4" />
                      </div>
                      <p className="mt-2 font-sans text-sm opacity-70">
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
      {mode !== "bookmarks" && Object.keys(letterOffsets).length > 0 && (
        <div className="z-30 shrink-0 border-t border-[#1a1a1a] bg-white px-8 pt-4 pb-6">
          <div className="mx-auto flex w-full max-w-7xl flex-row flex-nowrap items-center justify-between">
            {"abcdefghijklmnopqrstuvwxyz".split("").map((l) => {
              const isAvailable = letterOffsets[l] !== undefined && letterOffsets[l] !== -1
              return (
                <button
                  key={l}
                  disabled={!isAvailable}
                  onClick={() => jumpToLetter(l)}
                  className={`flex-1 border-none bg-transparent px-0.5 text-center font-mono text-[11px] uppercase transition-all ${
                    activeLetter === l
                      ? "scale-110 font-extrabold text-black"
                      : isAvailable
                        ? "text-neutral-500 hover:text-black"
                        : "cursor-not-allowed text-neutral-300"
                  } `}
                >
                  <span className={!isAvailable ? "line-through opacity-40" : ""}>{l}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
