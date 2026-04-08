"use client"

import { ArrowRight } from "lucide-react"
import Link from "next/link"

function LandingView() {
  return (
    <>
      {/* Header / Masthead */}
      <header className="border-b border-[#1a1a1a] p-6 lg:p-8 flex justify-between items-start shrink-0">
        <div>
          <h1 className="font-serif text-5xl lg:text-7xl font-bold uppercase tracking-tighter leading-none">
            Wordloom
          </h1>
          <p className="font-mono text-xs uppercase tracking-[0.2em] mt-3 opacity-60">
            Vol. 1 — The Engineering Issue
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="font-mono text-xs uppercase opacity-40 mb-1">Status</p>
          <p className="font-sans text-sm font-semibold uppercase">Online</p>
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2">
        {/* Left Column: Visual / Minimal Text */}
        <div className="p-6 lg:p-12 border-r border-[#1a1a1a] flex flex-col relative overflow-hidden bg-[#fbfaf5]">
          <div className="flex-1 w-full flex flex-col items-center justify-center text-center gap-6">
            <div className="w-24 h-px bg-[#1a1a1a] opacity-20" />
            <h2 className="font-serif text-3xl lg:text-5xl font-bold uppercase tracking-tight leading-tight max-w-[12ch]">
              The Art of Phonotactics
            </h2>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-40">
              Precision Word Generation
            </p>
            <div className="w-24 h-px bg-[#1a1a1a] opacity-20" />
          </div>

          <div className="absolute bottom-6 left-6 lg:bottom-12 lg:left-12 font-mono text-[10px] uppercase tracking-widest opacity-40">
            System Architecture: 01
          </div>
        </div>

        {/* Right Column: Nav / CTA */}
        <div className="flex flex-col">
          <div className="flex-1 p-6 lg:p-12 flex flex-col items-start justify-center border-b border-[#1a1a1a] bg-[#f8f7f2]">
            <h3 className="font-serif text-xl uppercase mb-3 text-black">The Concept</h3>
            <p className="font-sans text-sm opacity-60 m-0">
              Wordloom extracts transitions from the Carnegie Mellon University Pronouncing
              Dictionary. You provide constraints—length, prefixes, stems—and the algorithm
              calculates the most probable sequences to craft entirely new non-words.
            </p>
          </div>

          <div className="grid grid-cols-2 flex-grow min-h-[140px]">
            <Link
              href="/docs"
              className="group p-6 lg:p-8 flex flex-col items-start justify-center border-r border-[#1a1a1a] bg-[#ecebe5] hover:bg-[#1a1a1a] hover:text-[#ecebe5] relative overflow-hidden cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-[10px] uppercase tracking-widest opacity-60 group-hover:opacity-100">
                  Reference
                </span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100" />
              </div>
              <h2 className="font-serif text-2xl lg:text-3xl font-bold uppercase tracking-tight">
                CLI Docs
              </h2>
            </Link>
            <Link
              href="/studio"
              className="group p-6 lg:p-8 flex flex-col items-start justify-center bg-[#ecebe5] hover:bg-[#1a1a1a] hover:text-[#ecebe5] relative overflow-hidden cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-[10px] uppercase tracking-widest opacity-60 group-hover:opacity-100">
                  Action
                </span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100" />
              </div>
              <h2 className="font-serif text-3xl font-bold uppercase tracking-tighter">Studio</h2>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default function LandingPage() {
  return (
    <div className="relative min-h-screen text-[#1a1a1a] flex items-center justify-center p-4 selection:bg-[#1a1a1a] selection:text-[#ecebe5] bg-[#ecebe5]">
      <main className="w-full max-w-6xl min-h-[95vh] md:h-[85vh] bg-white border border-[#1a1a1a] shadow-2xl overflow-hidden flex flex-col relative z-20">
        <LandingView />
      </main>
    </div>
  )
}
